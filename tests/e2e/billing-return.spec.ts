import { test, expect, type Page } from '@playwright/test'
import { mockBackend } from './fixtures'

const reference = 'test/payment&receipt'
const callback = `/billing/success?reference=${encodeURIComponent(reference)}&trxref=paystack-test`
const premium = { billingEnabled: true, plan: 'premium', status: 'active', paidThrough: '2026-12-01T00:00:00Z', cancelAtPeriodEnd: false, projects: { used: 2, limit: null }, canUpgrade: false }

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/.*(?:googletagmanager\.com|clarity\.ms)\//, route => route.abort())
})

async function mockBilling(page: Page) {
  const verificationRequests: { reference: string | null; authorization: string | undefined }[] = []
  await page.route('**/api/billing/**', route => {
    const request = route.request(), url = new URL(request.url())
    if (url.pathname === '/api/billing/plans') return route.fulfill({ json: {
      currency: 'NGN', billingEnabled: true,
      plans: [{ id: 'free', name: 'Free', priceNgn: 0, interval: 'month', projectLimit: 2 }, { id: 'premium', name: 'Premium', priceNgn: 2499, interval: 'month', projectLimit: null }],
    } })
    if (url.pathname === '/api/billing/verify') {
      verificationRequests.push({ reference: url.searchParams.get('reference'), authorization: request.headers().authorization })
      return route.fulfill({ json: { ...premium, paid: true, paymentStatus: 'success' } })
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected billing endpoint' } })
  })
  return verificationRequests
}

async function expectStandalone(page: Page) {
  await expect(page.getByRole('heading', { name: "You're on Premium", exact: true })).toBeVisible()
  await expect(page.locator('.auth-header')).toBeVisible()
  await expect(page.getByRole('complementary')).toHaveCount(0)
  await expect(page.getByRole('navigation')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

for (const width of [375, 1440]) {
  test(`logged-out payment return survives login and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await mockBackend(page, { role: 'learner', signedIn: false })
    const requests = await mockBilling(page)
    await page.goto(callback)
    await expect(page).toHaveURL(/\/login$/)
    expect(requests).toHaveLength(0)
    await page.reload()
    await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
    await page.getByLabel('Password', { exact: true }).fill('TestPass123')
    await page.getByRole('button', { name: 'Log in', exact: true }).click()
    await expect(page).toHaveURL(url => url.pathname + url.search === callback)
    await expectStandalone(page)
    expect(requests.length).toBeGreaterThan(0)
    expect(requests.every(r => r.reference === reference && r.authorization === 'Bearer test-only-session')).toBe(true)
    expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-session')
    await page.reload()
    await expectStandalone(page)
  })

  test(`signed-in learner sees standalone confirmation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await mockBackend(page, { role: 'learner' })
    const requests = await mockBilling(page)
    await page.goto(callback)
    await expectStandalone(page)
    await expect(page).toHaveURL(url => url.pathname + url.search === callback)
    expect(requests.every(r => r.authorization === 'Bearer test-only-session')).toBe(true)
    await expect(page.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/app/dashboard')
  })
}

test('institution admins cannot enter learner payment confirmation', async ({ page }) => {
  await mockBackend(page, { role: 'admin' })
  const requests = await mockBilling(page)
  await page.goto(callback)
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.locator('.admin-stats')).toBeVisible()
  expect(requests).toHaveLength(0)
})

test('missing and unverified payment references never show a successful payment', async ({ page }) => {
  await mockBackend(page, { role: 'learner' })
  const requests = await mockBilling(page)
  await page.goto('/billing/success')
  await expect(page.getByRole('heading', { name: "We couldn't find that payment" })).toBeVisible()
  expect(requests).toHaveLength(0)
  await page.route('**/api/billing/verify?*', route => route.fulfill({ json: { ...premium, plan: 'free', paid: false, paymentStatus: 'failed' } }))
  await page.goto(callback)
  await expect(page.getByRole('heading', { name: "Your payment didn't go through" })).toBeVisible()
  await expect(page.getByRole('heading', { name: "You're on Premium", exact: true })).toHaveCount(0)
  await expect(page.getByRole('navigation')).toHaveCount(0)
})
