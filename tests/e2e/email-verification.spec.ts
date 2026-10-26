import { test, expect } from '@playwright/test'
import { mockBackend } from './fixtures'

for (const role of ['learner', 'admin'] as const) {
  test(`email verification refreshes the ${role} session and opens its dashboard`, async ({ page }) => {
    const backend = await mockBackend(page, { role, verified: false })
    let redemptions = 0
    await page.route('**/api/auth/verify-email?*', async route => {
      redemptions++
      expect(new URL(route.request().url()).searchParams.get('token')).toBe('test-verification-link')
      expect(route.request().headers().authorization).toBeUndefined()
      backend.user.emailVerified = true
      await route.fulfill({ json: { message: 'Email verified', institutionStatus: 'approved' } })
    })
    await page.goto('/verify-email?token=test-verification-link')
    await expect(page).toHaveURL(role === 'admin' ? /\/admin\/dashboard$/ : /\/app\/dashboard$/)
    expect(redemptions).toBe(1)
    expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-session')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('auth_user') || '{}').emailVerified)).toBe(true)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toHaveCount(0)
  })
}

test('verification waits for the refreshed account before navigating', async ({ page }) => {
  const backend = await mockBackend(page, { verified: false })
  let releaseAccount!: () => void
  const accountReady = new Promise<void>(resolve => { releaseAccount = resolve })
  let refreshing = false
  await page.route('**/api/auth/verify-email?*', async route => {
    backend.user.emailVerified = true
    await route.fulfill({ json: { message: 'Email verified' } })
  })
  await page.route('**/api/auth/me', async route => {
    const user = { ...backend.user }
    if (user.emailVerified) { refreshing = true; await accountReady }
    await route.fulfill({ json: { user } })
  })
  try {
    await page.goto('/verify-email?token=slow-account-test')
    await expect.poll(() => refreshing).toBe(true)
    await expect(page).toHaveURL(/\/verify-email\?token=slow-account-test$/)
    await expect(page.getByRole('heading', { name: 'Verifying your email…' })).toBeVisible()
  } finally { releaseAccount() }
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
})

test('an already-used email link opens the dashboard after confirming the existing session', async ({ page }) => {
  await mockBackend(page)
  let redemptions = 0
  await page.route('**/api/auth/verify-email?*', route => {
    redemptions++
    return route.fulfill({ status: 400, json: { message: 'This link is invalid or has expired' } })
  })
  await page.goto('/verify-email?token=used-link-test')
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  expect(redemptions).toBe(1)
})

test('an expired email link does not mark an unverified account as verified', async ({ page }) => {
  await mockBackend(page, { verified: false })
  await page.route('**/api/auth/verify-email?*', route => route.fulfill({ status: 400, json: { message: 'This link is invalid or has expired' } }))
  await page.goto('/verify-email?token=expired-link-test')
  await expect(page.getByRole('alert')).toContainText('This link is invalid or has expired')
  await expect(page).toHaveURL(/\/verify-email\?token=expired-link-test$/)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('auth_user') || '{}').emailVerified)).toBe(false)
})

test('a failed account refresh can retry without redeeming the email link again', async ({ page }) => {
  const backend = await mockBackend(page, { verified: false })
  let failRefresh = true
  let redemptions = 0
  await page.route('**/api/auth/verify-email?*', async route => {
    redemptions++
    backend.user.emailVerified = true
    await route.fulfill({ json: { message: 'Email verified' } })
  })
  await page.route('**/api/auth/me', route => {
    if (backend.user.emailVerified && failRefresh) return route.fulfill({ status: 503, json: { message: 'Account temporarily unavailable' } })
    return route.fulfill({ json: { user: backend.user } })
  })
  await page.goto('/verify-email?token=retry-account-test')
  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Account temporarily unavailable')
  failRefresh = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  expect(redemptions).toBe(1)
})

test('a verification token cannot sign in a browser without an existing session', async ({ page }) => {
  await mockBackend(page, { signedIn: false })
  await page.route('**/api/auth/verify-email?*', route => route.fulfill({ json: { message: 'Email verified' } }))
  await page.goto('/verify-email?token=verification-is-not-a-login-token')
  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Log in', exact: true })).toHaveAttribute('href', '/login')
  await expect(page).toHaveURL(/\/verify-email\?token=verification-is-not-a-login-token$/)
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBeNull()
})

test('a delayed pre-verification account response cannot overwrite the verified session', async ({ page }) => {
  const backend = await mockBackend(page, { verified: false })
  let started!: () => void
  const accountStarted = new Promise<void>(resolve => { started = resolve })
  let releaseOldAccount!: () => void
  const oldAccountReady = new Promise<void>(resolve => { releaseOldAccount = resolve })
  let staleResponses = 0
  await page.route('**/api/auth/me', async route => {
    const user = { ...backend.user }
    if (!user.emailVerified) { started(); await oldAccountReady }
    await route.fulfill({ json: { user } })
    if (!user.emailVerified) staleResponses++
  })
  await page.route('**/api/auth/verify-email?*', async route => {
    await accountStarted
    backend.user.emailVerified = true
    await route.fulfill({ json: { message: 'Email verified' } })
  })
  try {
    await page.goto('/verify-email?token=delayed-startup-test')
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
  } finally { releaseOldAccount() }
  await expect.poll(() => staleResponses).toBeGreaterThan(0)
  await expect(page.locator('.admin-stats')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('auth_user') || '{}').emailVerified)).toBe(true)
})

test('a saved token can recover after verification even when cached user details are missing', async ({ page }) => {
  const backend = await mockBackend(page, { verified: false })
  await page.addInitScript(() => localStorage.removeItem('auth_user'))
  let failRefresh = true
  await page.route('**/api/auth/me', route => route.fulfill(failRefresh
    ? { status: 503, json: { message: 'Account temporarily unavailable' } }
    : { json: { user: backend.user } }))
  await page.route('**/api/auth/verify-email?*', async route => {
    backend.user.emailVerified = true
    await route.fulfill({ json: { message: 'Email verified' } })
  })
  await page.goto('/verify-email?token=missing-cache-test')
  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
  failRefresh = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-session')
})
