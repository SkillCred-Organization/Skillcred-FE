import { test, expect } from '@playwright/test'

const plans = {
  currency: 'NGN', billingEnabled: true,
  plans: [{ id: 'free', name: 'Free', priceNgn: 0, interval: 'month', projectLimit: 3 },
    { id: 'premium', name: 'Premium', priceNgn: 4999, interval: 'month', projectLimit: null }],
}

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/.*(?:googletagmanager\.com|clarity\.ms)\//, route => route.abort())
})

for (const width of [375, 1024, 1440]) {
  test(`landing pricing uses the public API and fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    const authorizations: (string | undefined)[] = []
    await page.route('**/api/billing/plans', route => {
      authorizations.push(route.request().headers().authorization)
      return route.fulfill({ json: plans })
    })
    await page.goto('/#pricing')
    const section = page.getByRole('region', { name: 'Start free. Upgrade when you need more room.' })
    await expect(section.getByText('₦4,999', { exact: false })).toBeVisible()
    await expect(section.getByText('Up to 3 projects', { exact: true })).toBeVisible()
    await expect(section.getByText('Add more than 3 projects', { exact: true })).toBeVisible()
    await expect(section).not.toContainText(/bank transfer|Transfers are matched automatically/)
    expect(authorizations.length).toBeGreaterThan(0)
    expect(authorizations.every(value => value === undefined)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(section.getByRole('link', { name: 'Get Started Free' })).toHaveAttribute('href', '/user-type')
    await section.getByRole('link', { name: 'Explore Premium' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await page.evaluate(() => window.history.state.usr.from)).toBe('/app/billing')
  })
}

test('disabled billing and a failed plans request show honest states', async ({ page }) => {
  let unavailable = true
  await page.route('**/api/billing/plans', route => route.fulfill(unavailable
    ? { status: 503, json: { message: 'Plans unavailable' } }
    : { json: { ...plans, billingEnabled: false } }))
  await page.goto('/#pricing')
  const section = page.locator('#pricing')
  await expect(section.getByRole('alert')).toContainText('We couldn’t load the plans.')
  await expect(section.locator('.pricing-price')).toHaveCount(0)
  unavailable = false
  await section.getByRole('button', { name: 'Try again' }).click()
  await expect(section.getByText('Premium upgrades aren’t available yet.')).toBeVisible()
  await expect(section.getByRole('link', { name: 'Explore Premium' })).toHaveCount(0)
  await expect(section.getByRole('link', { name: 'Get Started Free' })).toBeVisible()
})
