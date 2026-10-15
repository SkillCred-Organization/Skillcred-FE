import { test, expect } from '@playwright/test'
import { mockBackend } from './fixtures'

test('admin login, verify and request changes persist through the review queue', async ({ page }) => {
  const backend = await mockBackend(page, { signedIn: false })
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('tunde@lagostech.example.test')
  await page.getByLabel('Password', { exact: true }).fill('TestOnly123')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Tunde/ })).toBeVisible()
  await expect(page.locator('.admin-user')).toContainText('Tunde Bello')
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-session')
  await page.getByRole('link', { name: 'Open review queue' }).click()
  await page.locator('.claim-row').filter({ hasText: 'Inventory tracker' }).click()
  await page.getByRole('button', { name: 'Verify', exact: true }).click()
  await expect(page.locator('.claim-title')).toContainText('Verified')
  expect(backend.writes.filter(w => w.path.endsWith('/verify'))).toHaveLength(1)
  await page.getByRole('link', { name: 'Back to review queue' }).click()
  await page.locator('.claim-row').filter({ hasText: 'Kwame' }).click()
  await page.getByRole('button', { name: 'Ask for changes' }).click()
  await page.getByRole('combobox', { name: 'Reason', exact: true }).selectOption({ label: 'Incorrect dates' })
  await page.getByLabel('Message to learner').fill('Please correct the programme end date.')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.locator('.claim-title')).toContainText('Needs changes')
  expect(backend.writes.at(-1)?.body).toEqual({ reason: 'Incorrect dates', message: 'Please correct the programme end date.' })
  await page.getByRole('link', { name: 'Back to review queue' }).click()
  await expect(page.getByRole('heading', { name: 'You’re all caught up' })).toBeVisible()
  await page.getByRole('button', { name: /^Verified/ }).click()
  await expect(page.locator('.claim-row').filter({ hasText: 'Inventory tracker' })).toBeVisible()
})

test('institution owner saves supported fields and programmes, with accessible modal focus', async ({ page }) => {
  const backend = await mockBackend(page)
  await page.goto('/admin/institution')
  await page.getByLabel('Institution name', { exact: true }).fill('Lagos Technology Institute')
  await page.getByRole('textbox', { name: 'About', exact: true }).fill('Learning through practical projects.')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByLabel('Institution name', { exact: true })).toHaveValue('Lagos Technology Institute')
  expect(backend.writes[0].body).toEqual({ name: 'Lagos Technology Institute', about: 'Learning through practical projects.', registrationNumber: 'LTI-1234' })
  await page.getByRole('button', { name: 'Add programme' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await dialog.getByLabel('Programme name').fill('Data Analysis')
  await dialog.getByLabel('Cohorts (one per line)').fill('2026 Cohort 3')
  await dialog.getByRole('button', { name: 'Add programme' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Analysis' })).toBeVisible()
  expect(backend.writes.at(-1)?.body.programmes).toEqual([{ name: 'Software Engineering', cohorts: ['2025 Cohort 2'] }, { name: 'Product Design', cohorts: ['2026 Cohort 1'] }, { name: 'Data Analysis', cohorts: ['2026 Cohort 3'] }])
})

test('learners filter and details show the selected learner’s claims only', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/admin/learners')
  await page.getByRole('button', { name: 'With pending claims' }).click()
  await expect(page.locator('.learner-select')).toHaveCount(2)
  await page.locator('.learner-select').filter({ hasText: 'Kwame Mensah' }).click()
  await expect(page.locator('.learner-detail h2')).toHaveText('Kwame Mensah')
  await expect(page.locator('.learner-claim')).toHaveCount(1)
  await expect(page.locator('.learner-claim')).toContainText('Product Design programme')
  await page.getByRole('searchbox').fill('No matching learner')
  await expect(page.getByRole('heading', { name: 'No learners found' })).toBeVisible()
})

test('learner settings save profile, rotate the token and download data', async ({ page }) => {
  const backend = await mockBackend(page, { role: 'learner' })
  await page.goto('/app/settings')
  await expect(page.getByLabel('Full name')).toHaveValue('Munachi David')
  await page.getByLabel('Headline').fill('Frontend Engineer')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Account changes saved.')).toBeVisible()
  expect(backend.writes[0].body).toEqual({ headline: 'Frontend Engineer', location: 'Lagos, Nigeria' })
  await page.getByRole('tab', { name: 'Security & data' }).click()
  await page.getByLabel('Current password', { exact: true }).fill('OldTest123')
  await page.getByLabel('New password', { exact: true }).fill('NewTest123')
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.getByText('Password updated. You’ve been logged out on other devices.')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe('test-only-rotated-session')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download my data' }).click()
  expect((await download).suggestedFilename()).toBe('skillcred-data.json')
})

test('pending institutions cannot access claim reviews', async ({ page }) => {
  const backend = await mockBackend(page, { approved: false })
  await page.goto('/admin/claims/claim-1')
  await expect(page.getByRole('heading', { name: 'We’re checking Lagos Tech Institute' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Verify', exact: true })).toHaveCount(0)
  expect(backend.writes).toHaveLength(0)
})

test('learners cannot enter admin pages', async ({ page }) => {
  await mockBackend(page, { role: 'learner' })
  await page.goto('/admin/queue')
  await expect(page).toHaveURL(/\/app\/dashboard$/)
})

test('learners without a profile complete onboarding before opening dashboard or settings', async ({ page }) => {
  await mockBackend(page, { role: 'learner' })
  await page.route('**/api/learner/profile', route => route.fulfill({ json: { profile: null } }))
  for (const path of ['/app/dashboard', '/app/settings']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: 'Tell us about you' })).toBeVisible()
  }
})

test('admins are routed from learner settings to their own dashboard', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/app/settings')
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.locator('.admin-stats')).toBeVisible()
})

test('unverified admin accounts must confirm their email', async ({ page }) => {
  await mockBackend(page, { verified: false })
  await page.goto('/admin/queue')
  await expect(page).toHaveURL(/\/verify-email$/)
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
})

test('reviewers cannot edit institution details', async ({ page }) => {
  await mockBackend(page, { owner: false })
  await page.goto('/admin/institution')
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Add programme' })).toBeDisabled()
})

test('queue network failures offer retry and recover', async ({ page }) => {
  await mockBackend(page)
  let failed = true
  await page.route('**/api/admin/claims?*', async route => { if (failed) await route.abort(); else await route.fallback() })
  await page.goto('/admin/queue')
  await expect(page.getByRole('heading', { name: 'We couldn’t load this page' })).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.locator('.claim-row')).toHaveCount(2)
})

test('a decision conflict refreshes the claim without repeating the mutation', async ({ page }) => {
  const backend = await mockBackend(page, { conflict: true })
  await page.goto('/admin/claims/claim-1')
  await page.getByRole('button', { name: 'Verify', exact: true }).click()
  await expect(page.locator('.claim-title')).toContainText('Verified')
  expect(backend.writes).toHaveLength(1)
})

for (const width of [320, 375, 768, 1440]) {
  test(`admin layouts fit a ${width}px viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await mockBackend(page)
    for (const path of ['/admin/dashboard', '/admin/queue', '/admin/claims/claim-1', '/admin/learners', '/admin/institution', '/admin/settings', '/admin/profile']) {
      await page.goto(path)
      await expect(page.locator('.admin-main')).toBeVisible()
      await expect(page.locator('.workspace-skeleton')).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`${path.split('/').at(-1)}-${width}.png`), fullPage: true })
    }
  })
}

for (const width of [320, 375, 1440]) {
  test(`learner settings tabs fit a ${width}px viewport`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
    await mockBackend(page, { role: 'learner' })
    await page.goto('/app/settings')
    await expect(page.getByLabel('Headline')).toBeVisible()
    for (const tab of ['Account', 'Notifications', 'Security & data']) {
      await page.getByRole('tab', { name: tab, exact: true }).click()
      await expect(page.locator('.workspace-skeleton')).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${tab.replaceAll(/[^a-z]/gi, '-')}-${width}.png`), fullPage: true })
    }
  })
}
