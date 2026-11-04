import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mockBackend } from './fixtures'

const institutions = [
  { id: 'institution-1', name: 'Lagos Tech Institute' },
  { id: 'institution-2', name: 'ALT School Africa' },
]

async function openInstitutionStep(page: Page) {
  await mockBackend(page, { role: 'learner' })
  await page.route('**/api/learner/institutions**', route => route.fulfill({ json: { institutions } }))
  await page.goto('/onboarding')
  await page.getByLabel('Headline').fill('Backend Engineer')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Where did you study?' })).toBeVisible()
  await page.getByLabel('Track').fill('Software Engineering')
  await page.getByLabel('Year').selectOption({ index: 1 })
}

async function continueToSkills(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Add your skills' })).toBeVisible()
}

test('"My institution isn\'t listed" in the open list works on the first tap', async ({ page }) => {
  await openInstitutionStep(page)
  await page.getByLabel('Institution').click()
  await page.getByRole('option', { name: "My institution isn't listed" }).click()
  await expect(page.getByLabel('Institution name')).toBeFocused()
  await page.getByLabel('Institution name').fill('Unilag')
  await continueToSkills(page)
})

test('an unlisted name typed into the list can be used as typed', async ({ page }) => {
  await openInstitutionStep(page)
  await page.getByLabel('Institution').fill('Unilag')
  await page.getByRole('option', { name: /Use .Unilag. as typed/ }).click()
  await expect(page.getByLabel('Institution name')).toHaveValue('Unilag')
  await continueToSkills(page)
})

test('Continue works on the first tap while the list is open', async ({ page }) => {
  await openInstitutionStep(page)
  await page.getByLabel('Institution').fill('lagos tech institute') // typed in full, not picked
  await expect(page.getByRole('listbox')).toBeVisible()
  await continueToSkills(page)
})

test('tapping the "isn\'t listed" button repeatedly never loses the institution', async ({ page }) => {
  await openInstitutionStep(page)
  await page.getByLabel('Institution').fill('ALT School Africa')
  await page.getByRole('heading', { name: 'Where did you study?' }).click() // close the list
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: "My institution isn't listed" }).click()
    await expect(page.getByLabel('Institution name')).toHaveValue('ALT School Africa')
    await page.getByRole('button', { name: 'Pick from the list instead' }).click()
    await expect(page.getByLabel('Institution', { exact: true })).toHaveValue('ALT School Africa')
  }
  await continueToSkills(page)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

  test('fields are big enough that iOS does not zoom, and nothing scrolls sideways', async ({ page }) => {
    await openInstitutionStep(page)
    for (const field of [page.getByLabel('Institution'), page.getByLabel('Track'), page.getByLabel('Year')]) {
      expect(await field.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
    }
    await page.getByLabel('Institution').tap()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  })
})
