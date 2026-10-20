import { test, expect } from '@playwright/test'

test('homepage and login account links open the user-type choice', async ({ page }) => {
  for (const path of ['/', '/login']) {
    await page.goto(path)
    await page.getByRole('link', { name: 'Create an account', exact: true }).click()
    await expect(page).toHaveURL(/\/user-type$/)
    await expect(page.getByRole('heading', { name: 'Which user are you?' })).toBeVisible()
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
  }
})

for (const width of [375, 1440]) {
  test(`signup requires an explicit account choice and fits a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/user-type$/)
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Choose an account type to continue.')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.getByRole('radio', { name: /I’m a learner or graduate/ }).check()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page).toHaveURL(/\/signup\/learner$/)
    await expect(page.getByLabel('Full name', { exact: true })).toBeVisible()
    await expect(page.locator('.auth-role')).toContainText('Learner account')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.reload()
    await expect(page.getByLabel('Full name', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Change account type' }).click()
    await page.getByRole('radio', { name: /I represent an institution/ }).check()
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page).toHaveURL(/\/institution-signup$/)
    await expect(page.getByLabel('Institution name', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
