import { test, expect } from '@playwright/test'
import { mockBackend } from './fixtures'

for (const kind of ['certifications', 'achievements'] as const) {
  for (const width of [375, 1440]) {
    test(`${kind} can be added, edited, verified, withdrawn and deleted at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 812 : 1024 })
      await mockBackend(page, { role: 'learner' })
      const noun = kind === 'certifications' ? 'certification' : 'achievement'
      const base = `/api/learner/${kind}`
      const actions = (pending: boolean) => ({ edit: !pending, delete: !pending, requestVerification: !pending, withdraw: pending })
      let item: { id: string; title: string; summary: string; startDate: string; proofLink: string; status: string; actions: ReturnType<typeof actions> } | null = null
      const writes: { path: string; method: string; body: Record<string, unknown> }[] = []

      await page.route(`**${base}**`, async route => {
        const request = route.request()
        const method = request.method()
        const path = new URL(request.url()).pathname
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
        expect(request.headers().authorization).toBe('Bearer test-only-session')
        const body = request.postDataJSON() || {}
        const json = (value: unknown) => route.fulfill({ json: value, headers })
        if (method === 'GET' && path === base) return json({ items: item ? [item] : [] })
        writes.push({ path, method, body })
        if (method === 'POST' && path === base) {
          item = { id: 'item-1', title: body.title, summary: body.summary, startDate: body.startDate, proofLink: body.proofLink, status: 'self-reported', actions: actions(false) }
          return json({ item })
        }
        if (!item) return route.fulfill({ status: 404, json: { message: 'Item missing' }, headers })
        if (method === 'PATCH' && path === `${base}/item-1`) {
          item = { ...item, ...body }
          return json({ item })
        }
        if (method === 'POST' && [ `${base}/item-1/request-verification`, `${base}/item-1/withdraw` ].includes(path)) {
          const pending = path.endsWith('/request-verification')
          item = { ...item, status: pending ? 'pending' : 'self-reported', actions: actions(pending) }
          return json({ item })
        }
        if (method === 'DELETE' && path === `${base}/item-1`) {
          item = null
          return json({ message: 'Deleted' })
        }
        return route.fulfill({ status: 404, json: { message: `Unexpected request: ${method} ${path}` }, headers })
      })

      await page.goto(`/app/${kind}`)
      await expect(page.getByRole('heading', { name: `No ${kind} yet` })).toBeVisible()
      await page.getByRole('button', { name: `Add ${noun}`, exact: true }).first().click()
      const form = page.getByRole('dialog')
      await form.getByLabel('Title', { exact: true }).fill(`Test ${noun}`)
      await form.getByLabel(kind === 'certifications' ? 'Issued by' : 'Awarded by').fill('Example Institute')
      await form.getByLabel(kind === 'certifications' ? 'Issue date' : 'Date', { exact: true }).fill('2026-10-01')
      await form.getByLabel('Link (optional)').fill('https://example.test/proof')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await form.getByRole('button', { name: `Add ${noun}`, exact: true }).click()
      await expect(form).toHaveCount(0)
      await expect(page.getByRole('heading', { name: `Test ${noun}`, exact: true })).toBeVisible()
      expect(writes[0].body).toEqual({ title: `Test ${noun}`, summary: 'Example Institute', startDate: '2026-10-01', proofLink: 'https://example.test/proof' })

      await page.getByRole('button', { name: `Edit Test ${noun}`, exact: true }).click()
      await form.getByLabel('Title', { exact: true }).fill(`Updated ${noun}`)
      await form.getByRole('button', { name: 'Save changes', exact: true }).click()
      await expect(form).toHaveCount(0)
      await page.reload()
      await expect(page.getByRole('heading', { name: `Updated ${noun}`, exact: true })).toBeVisible()

      await page.getByRole('button', { name: 'Request verification', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('button', { name: 'Withdraw', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Withdraw', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Request verification', exact: true })).toBeVisible()
      await page.getByRole('button', { name: /^Verified/ }).click()
      await expect(page.getByText('Nothing with this status.', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /^All/ }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

      await page.getByRole('button', { name: `Delete Updated ${noun}`, exact: true }).click()
      await form.getByRole('button', { name: 'Cancel', exact: true }).click()
      expect(writes.some(write => write.method === 'DELETE')).toBe(false)
      await page.getByRole('button', { name: `Delete Updated ${noun}`, exact: true }).click()
      await form.getByRole('button', { name: 'Delete', exact: true }).click()
      await expect(page.getByRole('heading', { name: `No ${kind} yet` })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: `No ${kind} yet` })).toBeVisible()
      expect(writes.map(({ method, path }) => `${method} ${path}`)).toEqual([
        `POST ${base}`, `PATCH ${base}/item-1`, `POST ${base}/item-1/request-verification`, `POST ${base}/item-1/withdraw`, `DELETE ${base}/item-1`,
      ])
    })
  }
}
