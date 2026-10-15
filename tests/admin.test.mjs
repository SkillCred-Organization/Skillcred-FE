import assert from 'node:assert/strict'
import { test, beforeEach, afterEach } from 'node:test'
import { adminApi, learnerClaims, safeEvidenceUrl, waitingLabel } from '../src/lib/admin.ts'
import { settingsApi } from '../src/lib/settings.ts'
import { analyticsPagePath } from '../src/lib/analytics.ts'
import { tokenStore } from '../src/lib/apiClient.ts'

const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } })
globalThis.window = new EventTarget()
const originalFetch = globalThis.fetch
let requests = []
function respond(value, status = 200) { globalThis.fetch = async (url, options) => { requests.push({ url, ...options }); return new Response(JSON.stringify(value), { status }) } }
beforeEach(() => { storage.clear(); requests = []; tokenStore.set('test-token') })
afterEach(() => { globalThis.fetch = originalFetch })

test('queue filters are encoded and authenticate with the session token', async () => {
  respond({ claims: [] })
  await adminApi.queue({ status: 'needs-changes', q: 'Ada & Kwame', page: 2 })
  const url = new URL(requests[0].url)
  assert.equal(url.pathname, '/api/admin/claims')
  assert.equal(url.searchParams.get('q'), 'Ada & Kwame')
  assert.equal(url.searchParams.get('status'), 'needs-changes')
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-token')
})
test('review decisions use documented payloads and a conflict is not retried', async () => {
  respond({ claim: {} })
  await adminApi.requestChanges('id/with slash', ' Dates ', ' Correct the end date. ')
  assert.equal(requests[0].url.endsWith('/id%2Fwith%20slash/request-changes'), true)
  assert.deepEqual(JSON.parse(requests[0].body), { reason: 'Dates', message: 'Correct the end date.' })
  respond({ message: 'Already decided', code: 'CLAIM_NOT_PENDING' }, 409)
  await assert.rejects(adminApi.verify('claim-1'), error => error.status === 409 && error.code === 'CLAIM_NOT_PENDING')
  assert.equal(requests.length, 2)
})
test('learner detail paginates and filters by ID when names are shared', async () => {
  globalThis.fetch = async (url) => {
    const page = new URL(url).searchParams.get('page')
    return Response.json({ totalPages: 2, claims: page === '1' ? [{ id: 'other', learner: { id: 'other-learner' } }] : [{ id: 'mine', learner: { id: 'learner-1' } }] })
  }
  const claims = await learnerClaims({ id: 'learner-1', fullName: 'Alex Smith' })
  assert.deepEqual(claims.map(claim => claim.id), ['mine'])
})
test('password change replaces the session token after success', async () => {
  respond({ token: 'new-token' })
  await settingsApi.changePassword('OldTest123', 'NewTest123')
  assert.equal(tokenStore.get(), 'new-token')
  assert.deepEqual(JSON.parse(requests[0].body), { currentPassword: 'OldTest123', newPassword: 'NewTest123' })
})
test('a late password response cannot restore a logged-out session', async () => {
  globalThis.fetch = async () => { tokenStore.clear(); return Response.json({ token: 'late-token' }) }
  await settingsApi.changePassword('OldTest123', 'NewTest123')
  assert.equal(tokenStore.get(), null)
})
test('invalid password responses and incorrect passwords preserve the existing token', async () => {
  respond({ message: 'Changed' })
  await assert.rejects(settingsApi.changePassword('OldTest123', 'NewTest123'))
  assert.equal(tokenStore.get(), 'test-token')
  respond({ message: 'Current password is incorrect', code: 'WRONG_PASSWORD' }, 400)
  await assert.rejects(settingsApi.changePassword('BadTest123', 'NewTest123'))
  assert.equal(tokenStore.get(), 'test-token')
})
test('evidence permits web links and rejects executable or credential-bearing URLs', () => {
  assert.equal(safeEvidenceUrl('https://github.com/example/project'), 'https://github.com/example/project')
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///secret', 'https://name:pass@example.com', 'not a url']) assert.equal(safeEvidenceUrl(value), null)
})
test('analytics paths exclude claim identifiers, handles, query tokens and unknown paths', () => {
  assert.equal(analyticsPagePath('/admin/claims/private-id?token=secret'), '/admin/claims/:claim')
  assert.equal(analyticsPagePath('/u/alex-smith'), '/u/:profile')
  assert.equal(analyticsPagePath('/reset-password?token=secret'), '/reset-password')
  assert.equal(analyticsPagePath('/person@example.com'), '/other')
  assert.equal(analyticsPagePath('/admin/queue'), '/admin/queue')
  assert.equal(waitingLabel(1), 'waiting 1 day')
})
