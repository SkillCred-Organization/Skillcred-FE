import { test, expect } from '@playwright/test'
import { mockBackend } from './fixtures'

test('an unverified learner can log in but every page asks them to verify', async ({ page }) => {
  await mockBackend(page, { role: 'learner', verified: false })
  let learnerCalls = 0
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/learner/')) learnerCalls++ })
  await page.goto('/app/dashboard')
  await expect(page.getByRole('heading', { name: 'Verify your email to use your dashboard' })).toBeVisible()
  await expect(page.getByText('Something went wrong')).toHaveCount(0)
  await page.getByRole('link', { name: 'Skills' }).first().click()
  await expect(page.getByRole('heading', { name: 'Verify your email to use Skills' })).toBeVisible()
  await page.goto('/onboarding', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  expect(learnerCalls).toBe(0) // the pages are not even asked for, so no 403 errors
})

test('"Verify my email" sends a link and opens the check-your-inbox page', async ({ page }) => {
  await mockBackend(page, { role: 'learner', verified: false })
  let resent = 0
  await page.route('**/api/auth/resend-verification', route => { resent++; return route.fulfill({ json: { message: 'Verification email sent' } }) })
  await page.goto('/app/projects')
  await page.getByRole('button', { name: 'Verify my email' }).click()
  await expect(page).toHaveURL(/\/verify-email$/)
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  await expect(page.getByText('learner@example.test')).toBeVisible()
  await expect(page.getByText(/You can resend in 0:\d\d/)).toBeVisible()
  expect(resent).toBe(1)
})

test('"I\'ve already verified" unlocks the page once the account says so', async ({ page }) => {
  const backend = await mockBackend(page, { role: 'learner', verified: false })
  await page.goto('/app/skills')
  await expect(page.getByRole('heading', { name: 'Verify your email to use Skills' })).toBeVisible()
  backend.user.emailVerified = true
  await page.getByRole('button', { name: "I've already verified" }).click()
  await expect(page.getByRole('heading', { name: /Verify your email/ })).toHaveCount(0)
})
