import { test, expect, type Locator, type Page } from '@playwright/test'
import { mockBackend } from './fixtures'

const plans = {
  currency: 'NGN', billingEnabled: true,
  plans: [
    { id: 'free', name: 'Free', priceNgn: 0, interval: null, projectLimit: 2 },
    { id: 'premium', name: 'Premium', priceNgn: 2499, interval: 'one-time', projectLimit: null },
  ],
}
const free = { billingEnabled: true, plan: 'free', status: null, paidThrough: null, projects: { used: 2, limit: 2 }, canUpgrade: true }
const premium = { ...free, plan: 'premium', status: 'active', paidThrough: '2099-12-31', projects: { used: 2, limit: null }, canUpgrade: false }
// Exact new /verify shape: no billingEnabled, paidThrough or receipt amount.
const verified = { paid: true, paymentStatus: 'success', plan: 'premium', status: 'active', canUpgrade: false, projects: { used: 2, limit: null } }

async function setup(page: Page) {
  const session = await mockBackend(page, { role: 'learner' })
  const requests: { path: string; method: string; authorization?: string; body: unknown }[] = []
  const state = { paid: false, billingReads: 0 }
  await page.route('**/api/billing/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname
    requests.push({ path, method: request.method(), authorization: request.headers().authorization, body: request.postDataJSON() })
    if (path === '/api/billing/plans') return route.fulfill({ json: plans })
    if (path === '/api/billing/me') {
      state.billingReads += 1
      return route.fulfill({ json: state.paid ? premium : free })
    }
    return route.fulfill({ status: 404, json: { message: 'Unexpected billing endpoint' } })
  })
  await page.route('**/api/learner/dashboard', route => route.fulfill({ json: { stats: { projects: { total: 2, verified: 0 } } } }))
  await page.route('**/api/learner/projects', route => route.fulfill({ json: { projects: [] } }))
  return { ...session, state, requests }
}

async function expectLayout(page: Page, content: Locator) {
  await page.evaluate(() => document.fonts.ready)
  expect(await content.evaluate(element => getComputedStyle(element).fontFamily)).toContain('DM Sans')
  expect(await page.evaluate(() => document.fonts.check('600 24px "DM Sans"'))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(content).not.toContainText(/per month|\/ month|renews|2099|manage subscription|cancel subscription|manage card|update card|bank transfer/i)
}

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/.*(?:googletagmanager\.com|clarity\.ms)\//, route => route.abort())
})

for (const width of [375, 1440]) {
  test(`one-time Plans display and authenticated Paystack checkout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await setup(page)
    const checkout: { body: unknown; authorization?: string; method: string }[] = []
    await page.route('**/api/billing/checkout', route => {
      const request = route.request()
      checkout.push({ body: request.postDataJSON(), authorization: request.headers().authorization, method: request.method() })
      return route.fulfill({ json: { authorizationUrl: 'https://checkout.paystack.com/test-only', reference: 'test-only' } })
    })
    // Do not visit a real payment form or charge a card.
    await page.route('https://checkout.paystack.com/test-only', route => route.fulfill({ contentType: 'text/html', body: '<h1>Mock Paystack checkout</h1>' }))
    await page.goto('/app/billing')
    const main = page.getByRole('main')
    await expect(main.getByText('One-time payment · Lifetime access')).toBeVisible()
    await expect(main.getByRole('cell', { name: 'Up to 2', exact: true })).toBeVisible()
    await expect(main.getByRole('cell', { name: 'Unlimited', exact: true })).toBeVisible()
    await expect(main.getByRole('paragraph').filter({ hasText: 'One-time payment · Lifetime access' })).toContainText('₦2,499')
    await expectLayout(page, main)
    await page.getByRole('button', { name: 'Proceed to Payment' }).click()
    await expect(page).toHaveURL('https://checkout.paystack.com/test-only')
    expect(checkout).toEqual([{ body: {}, authorization: 'Bearer test-only-session', method: 'POST' }])
  })

  test(`free project limit opens the lifetime upgrade prompt at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await setup(page)
    await page.goto('/app/projects')
    await expect(page.getByRole('heading', { name: "You've reached your Free Plan limit." })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('₦2,499 one-time payment')
    await page.getByRole('button', { name: 'Add project', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Unlimited projects with Premium' })
    await expect(dialog).toContainText('Your Free Plan includes 2 projects')
    await expect(dialog).toContainText('one-time payment · lifetime access')
    await expectLayout(page, dialog)
    await dialog.getByRole('button', { name: 'Not now' }).click()
    await expect(dialog).toHaveCount(0)
  })

  test(`trxref confirmation refreshes shared billing and unlocks projects at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    const { state } = await setup(page)
    const references: (string | null)[] = []
    await page.route('**/api/billing/verify?*', async route => {
      references.push(new URL(route.request().url()).searchParams.get('reference'))
      await expect.poll(() => state.billingReads).toBeGreaterThan(0)
      state.paid = true
      await route.fulfill({ json: verified })
    })
    await page.goto('/billing/success?reference=&trxref=SKC_test_lifetime')
    await expect(page.getByRole('heading', { name: "You're on Premium" })).toBeVisible()
    await expect.poll(() => state.billingReads).toBeGreaterThan(1)
    expect(references.every(reference => reference === 'SKC_test_lifetime')).toBe(true)
    await expectLayout(page, page.getByRole('status'))
    await page.getByRole('link', { name: 'Go to dashboard' }).click()
    await expect(page.getByText('Premium · Lifetime access', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explore Premium' })).toHaveCount(0)
    await page.getByRole('link', { name: 'Projects', exact: true }).filter({ visible: true }).click()
    await expect(page.getByRole('heading', { name: "You've reached your Free Plan limit." })).toHaveCount(0)
    await page.getByRole('button', { name: 'Add project', exact: true }).click()
    await expect(page.getByRole('dialog', { name: /Add.*project/i })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Unlimited projects with Premium' })).toHaveCount(0)
  })
}

test('pending and network-error returns do not claim success, and can recover', async ({ page }) => {
  await setup(page)
  let outcome: 'pending' | 'error' | 'paid' = 'pending'
  await page.route('**/api/billing/verify?*', route => route.fulfill(outcome === 'error'
    ? { status: 503, json: { message: 'Temporarily unavailable' } }
    : { json: { ...verified, paid: outcome === 'paid', paymentStatus: outcome === 'paid' ? 'success' : 'pending' } }))
  await page.goto('/billing/success?reference=test-pending')
  await expect(page.getByRole('heading', { name: "We're still confirming your payment" })).toBeVisible()
  await expect(page.getByRole('heading', { name: "You're on Premium" })).toHaveCount(0)
  outcome = 'error'
  await expect(page.getByRole('heading', { name: "We couldn't check your payment" })).toBeVisible()
  outcome = 'paid'
  await page.getByRole('button', { name: 'Check again' }).click()
  await expect(page.getByRole('heading', { name: "You're on Premium" })).toBeVisible()
})

test('a different learner does not inherit the previous Premium billing state', async ({ page }) => {
  const { state, user } = await setup(page)
  state.paid = true
  await page.goto('/app/billing')
  await expect(page.getByText('Your lifetime Premium is active')).toBeVisible()
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  state.paid = false
  const otherUser = { ...user, id: 'learner-2', email: 'another@example.test', fullName: 'Another Learner' }
  await page.route('**/api/auth/login', route => route.fulfill({ json: { user: otherUser, token: 'other-test-session' } }))
  await page.getByLabel('Email', { exact: true }).fill(otherUser.email)
  await page.getByLabel('Password', { exact: true }).fill('TestPass123')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/billing$/)
  await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeVisible()
  await expect(page.getByText('Your lifetime Premium is active')).toHaveCount(0)
})

test('a free learner below the two-project limit can add a project', async ({ page }) => {
  await setup(page)
  await page.route('**/api/billing/me', route => route.fulfill({ json: { ...free, projects: { used: 1, limit: 2 } } }))
  await page.goto('/app/projects')
  await expect(page.getByText('1 of 2 projects used')).toBeVisible()
  await page.getByRole('button', { name: 'Add project', exact: true }).click()
  await expect(page.getByRole('dialog', { name: /Add.*project/i })).toBeVisible()
})

test('account deletion keeps its email-code flow without subscription management', async ({ page }) => {
  const { state, requests } = await setup(page)
  state.paid = true
  let legacyError = true
  await page.route('**/api/account/delete/request', route => route.fulfill(legacyError
    ? { status: 409, json: { code: 'CANCEL_SUBSCRIPTION_FIRST', message: 'Legacy billing check' } }
    : { json: { sent: true, expiresInMinutes: 10, email: 'learner@example.test' } }))
  await page.goto('/app/settings?tab=account')
  await page.getByRole('button', { name: 'Delete account', exact: true }).click()
  await page.getByRole('button', { name: 'Send me a code' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Please contact support')
  await expect(dialog.getByRole('button', { name: /subscription|card/i })).toHaveCount(0)
  legacyError = false
  await page.getByRole('button', { name: 'Send me a code' }).click()
  await expect(dialog.getByLabel('6-digit code')).toBeVisible()
  expect(requests.some(request => request.path === '/api/billing/manage-link')).toBe(false)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
})
