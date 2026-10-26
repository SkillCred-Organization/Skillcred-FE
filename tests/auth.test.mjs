import { learnerProfileApi, profileUrl, suggestedProfileHandle } from '../src/lib/profile.ts'
import assert from 'node:assert/strict'
import { test, beforeEach, afterEach } from 'node:test'
import { apiClient, apiUrl, ApiError, AUTH_TOKEN_KEY, AUTH_USER_KEY, SESSION_EXPIRED_EVENT, tokenStore } from '../src/lib/apiClient.ts'
import { authApi, saveSession, saveUser, readStoredUser, websiteDomain, emailMatchesWebsite, authDestination } from '../src/lib/auth.ts'

const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
} })
globalThis.window = new EventTarget()
const originalFetch = globalThis.fetch
let requests = []
function respond(body, status = 200) {
  globalThis.fetch = async (url, options) => { requests.push({ url, ...options }); return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }) }
}
beforeEach(() => { storage.clear(); requests = []; window.location = { origin: 'https://preview.example.test' } })
afterEach(() => { globalThis.fetch = originalFetch })
const session = { token: 'test-session', user: { id: 'test-user', role: 'learner', fullName: 'Test Learner', email: 'learner@example.test', emailVerified: true } }

test('login uses the documented endpoint and password payload; session uses auth_token', async () => {
  respond(session)
  const result = await authApi.login({ email: 'learner@example.test', password: 'TestPass123' })
  assert.equal(requests[0].url, 'http://localhost:4000/api/auth/login')
  assert.equal(requests[0].method, 'POST')
  assert.deepEqual(JSON.parse(requests[0].body), { email: 'learner@example.test', password: 'TestPass123' })
  assert.equal(requests[0].headers.get('Content-Type'), 'application/json')
  assert.equal(requests[0].headers.has('Authorization'), false)
  saveSession(result)
  assert.equal(storage.get('auth_token'), 'test-session')
  assert.deepEqual(JSON.parse(storage.get('auth_user')), session.user)
  assert.deepEqual(readStoredUser(), session.user)
})
test('authenticated requests use a Bearer header and /auth/me', async () => {
  storage.set(AUTH_TOKEN_KEY, 'test-token')
  respond({ user: session.user })
  await authApi.me()
  assert.equal(requests[0].url.endsWith('/api/auth/me'), true)
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-token')
})
test('field errors and all admin error codes survive API normalization', async () => {
  for (const code of ['FREE_EMAIL', 'DOMAIN_MISMATCH', 'INSTITUTION_EXISTS']) {
    respond({ message: 'Institution validation failed', code, errors: { email: ['Use a work email'] } }, 400)
    await assert.rejects(authApi.registerAdmin({}), e => e instanceof ApiError && e.code === code && e.fieldErrors.email[0] === 'Use a work email')
  }
})
test('failed public login does not erase an existing session', async () => {
  saveSession({ ...session, token: 'existing' })
  respond({ message: 'Invalid credentials' }, 401)
  await assert.rejects(authApi.login({ email: 'wrong@example.test', password: 'wrong' }))
  assert.equal(storage.get(AUTH_TOKEN_KEY), 'existing')
  assert.deepEqual(readStoredUser(), session.user)
})
test('protected 401 clears the expired token and notifies the UI', async () => {
  saveSession({ ...session, token: 'expired' })
  let notified = false
  window.addEventListener(SESSION_EXPIRED_EVENT, () => { notified = true }, { once: true })
  respond({ message: 'Session expired' }, 401)
  await assert.rejects(authApi.me())
  assert.equal(storage.has(AUTH_TOKEN_KEY), false)
  assert.equal(storage.has(AUTH_USER_KEY), false)
  assert.equal(notified, true)
})
test('a stale 401 cannot clear a newer session', async () => {
  storage.set(AUTH_TOKEN_KEY, 'old')
  globalThis.fetch = async () => { saveSession({ token: 'new', user: { ...session.user, fullName: 'New Learner' } }); return new Response('{"message":"expired"}', { status: 401 }) }
  await assert.rejects(authApi.me())
  assert.equal(storage.get(AUTH_TOKEN_KEY), 'new')
  assert.equal(readStoredUser().fullName, 'New Learner')
})
test('learner, admin and Google registrations send the required consent and role fields', async () => {
  respond(session)
  await authApi.registerLearner({ fullName: 'Test', email: 'test@example.test', password: 'TestPass123', acceptedTerms: true })
  assert.equal(JSON.parse(requests[0].body).acceptedTerms, true)
  await authApi.registerAdmin({ institutionName: 'Example', website: 'https://example.test', fullName: 'Admin', jobTitle: 'Lead', email: 'admin@example.test', password: 'TestPass123', authorised: true })
  assert.equal(requests[1].url.endsWith('/register/admin'), true)
  assert.equal(JSON.parse(requests[1].body).authorised, true)
  await authApi.google({ credential: 'google-test', role: 'learner', acceptedTerms: true })
  assert.deepEqual(JSON.parse(requests[2].body), { credential: 'google-test', role: 'learner', acceptedTerms: true })
  await authApi.google({ credential: 'existing-google-test' })
  assert.deepEqual(JSON.parse(requests[3].body), { credential: 'existing-google-test' })
})
test('reset uses the real token and excludes confirmPassword; requests have no session header', async () => {
  storage.set(AUTH_TOKEN_KEY, 'old-session')
  respond({ message: 'OK' })
  await authApi.forgotPassword('learner@example.test')
  await authApi.resetPassword('token-with-&?characters', 'NewPass123')
  assert.deepEqual(JSON.parse(requests[0].body), { email: 'learner@example.test' })
  assert.deepEqual(JSON.parse(requests[1].body), { token: 'token-with-&?characters', password: 'NewPass123' })
  assert.equal(requests[1].url.endsWith('/api/auth/reset-password'), true)
  assert.equal(requests[1].headers.has('Authorization'), false)
  await authApi.verifyEmail('token-with-&?characters')
  assert.equal(requests[2].url.endsWith('token=token-with-%26%3Fcharacters'), true)
})
test('network failures and malformed successful responses do not report success', async () => {
  globalThis.fetch = async () => { throw new TypeError('Network failed') }
  await assert.rejects(authApi.login({}), e => e.code === 'NETWORK_ERROR')
  globalThis.fetch = async () => new Response('<html>Not an API</html>', { status: 200 })
  await assert.rejects(authApi.login({}), e => e instanceof ApiError)
  assert.throws(() => saveSession({ user: session.user }), ApiError)
  assert.equal(storage.size, 0)
})
test('website checks accept real subdomains and reject lookalike domains', () => {
  assert.equal(websiteDomain('https://www.school.edu.ng/path'), 'school.edu.ng')
  assert.equal(websiteDomain('javascript:alert(1)'), '')
  assert.equal(websiteDomain('https://user:password@school.edu.ng'), '')
  assert.equal(emailMatchesWebsite('admin@staff.school.edu.ng', 'https://school.edu.ng'), true)
  assert.equal(emailMatchesWebsite('admin@school.edu.ng.evil.test', 'https://school.edu.ng'), false)
  assert.equal(emailMatchesWebsite('admin@fakeschool.edu.ng', 'https://school.edu.ng'), false)
})
test('API origins normalize /api once and forbid arbitrary destinations', () => {
  assert.equal(apiUrl('/api/auth/me', 'https://api.example.test/api/'), 'https://api.example.test/api/auth/me')
  assert.throws(() => apiUrl('https://evil.test/collect'))
})
test('new learners go to onboarding; successful logins go to the dashboard', () => {
  assert.equal(authDestination(session.user, 'signup'), '/onboarding')
  assert.equal(authDestination({ ...session.user, emailVerified: false }, 'signup'), '/onboarding')
  assert.equal(authDestination(session.user), '/app/dashboard')
  assert.equal(authDestination({ ...session.user, role: 'admin', emailVerified: false }), '/verify-email')
  assert.equal(authDestination({ ...session.user, role: 'admin', needsInstitution: true }), '/admin/dashboard')
  assert.equal(authDestination({ ...session.user, role: 'admin' }), '/admin/dashboard')
  assert.equal(authDestination({ ...session.user, role: 'admin', emailVerified: false }, 'signup'), '/verify-email')
  assert.equal(authDestination({ ...session.user, role: 'admin', needsInstitution: true }, 'signup'), '/admin/dashboard')
})

test('stored user data is ignored without a token or when malformed', () => {
  storage.set(AUTH_USER_KEY, JSON.stringify(session.user))
  assert.equal(readStoredUser(), null)
  tokenStore.set('existing')
  storage.set(AUTH_USER_KEY, '{broken')
  assert.equal(readStoredUser(), null)
  storage.set(AUTH_USER_KEY, JSON.stringify({ role: 'learner', fullName: {} }))
  assert.equal(readStoredUser(), null)
})

test('account refresh updates the persisted name and logout clears both session values', async () => {
  saveSession(session)
  const updatedUser = { ...session.user, fullName: 'Updated Learner' }
  respond({ user: updatedUser })
  saveUser((await authApi.me()).user)
  assert.equal(readStoredUser().fullName, 'Updated Learner')
  assert.equal(storage.get(AUTH_TOKEN_KEY), session.token)
  tokenStore.clear()
  assert.equal(storage.has(AUTH_TOKEN_KEY), false)
  assert.equal(storage.has(AUTH_USER_KEY), false)
  assert.equal(readStoredUser(), null)
})

test('incomplete sessions cannot replace the signed-in account', () => {
  saveSession(session)
  assert.throws(() => saveSession({ token: 'bad', user: { role: 'learner' } }), ApiError)
  assert.equal(storage.get(AUTH_TOKEN_KEY), session.token)
  assert.deepEqual(readStoredUser(), session.user)
})
test('profile lookup uses the authenticated learner endpoint and supports a missing profile', async () => {
  saveSession(session)
  respond({ profile: null })
  assert.equal((await learnerProfileApi.get()).profile, null)
  assert.equal(requests[0].url, 'http://localhost:4000/api/learner/profile')
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-session')
})

test('profile URLs use the current website and saved handle without inventing unset links', () => {
  for (const origin of ['https://preview.example.test', 'http://localhost:3000']) {
    window.location = { origin }
    assert.equal(profileUrl({ handle: 'munachi-david-2' }), `${origin}/u/munachi-david-2`)
    for (const profile of [undefined, null, {}, { handle: '' }, { handle: '  ' }]) assert.equal(profileUrl(profile), null)
    assert.equal(profileUrl({ handle: 'name/other?query' }), `${origin}/u/name%2Fother%3Fquery`)
  }
  assert.equal(suggestedProfileHandle('  Munachi David  '), 'munachi-david')
})

test('handle availability is encoded and saving changes only the handle field', async () => {
  saveSession(session)
  respond({ available: true })
  await learnerProfileApi.handleAvailable('name & other')
  assert.equal(requests[0].url, 'http://localhost:4000/api/learner/handle-available?handle=name%20%26%20other')
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-session')
  respond({ profile: { handle: 'munachi-david' } })
  const saved = await learnerProfileApi.saveHandle('munachi-david')
  assert.equal(requests[1].method, 'PATCH')
  assert.deepEqual(JSON.parse(requests[1].body), { handle: 'munachi-david' })
  assert.equal(profileUrl(saved.profile), 'https://preview.example.test/u/munachi-david')
})

test('a taken profile handle preserves the signed-in session and the server error', async () => {
  saveSession(session)
  respond({ message: 'Handle taken', fields: ['handle'] }, 409)
  await assert.rejects(learnerProfileApi.saveHandle('taken'), error => error instanceof ApiError && error.status === 409)
  assert.equal(readStoredUser().id, session.user.id)
})

function useMockRequestClock(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), milliseconds)
    return controller.signal
  })
}
function respondAfter(milliseconds, response = session) {
  globalThis.fetch = (url, options) => {
    requests.push({ url, ...options })
    return new Promise((resolve, reject) => {
      const cancel = () => reject(options.signal.reason)
      options.signal.addEventListener('abort', cancel, { once: true })
      setTimeout(() => {
        options.signal.removeEventListener('abort', cancel)
        resolve(new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } }))
      }, milliseconds)
    })
  }
}
test('login, signup and Google wait for a slow first response without sending duplicates', async t => {
  useMockRequestClock(t)
  respondAfter(45000)
  const responses = Promise.all([
    authApi.login({ email: 'learner@example.test', password: 'TestPass123' }),
    authApi.registerLearner({ fullName: 'Test', email: 'learner@example.test', password: 'TestPass123', acceptedTerms: true }),
    authApi.google({ credential: 'google-test' }),
  ])
  t.mock.timers.tick(45000)
  for (const result of await responses) assert.deepEqual(result, session)
  assert.equal(requests.length, 3)
})
test('a hung session refresh still times out when it has a cancellation signal', async t => {
  useMockRequestClock(t)
  saveSession(session)
  respondAfter(120000)
  const caller = new AbortController()
  const rejected = assert.rejects(authApi.me(caller.signal), error => error.code === 'REQUEST_TIMEOUT')
  t.mock.timers.tick(90000)
  await rejected
  assert.equal(requests.length, 1)
  assert.equal(caller.signal.aborted, false)
  assert.equal(readStoredUser().id, session.user.id)
})
test('navigation cancellation is preserved instead of becoming a connection error', async t => {
  useMockRequestClock(t)
  respondAfter(45000)
  const caller = new AbortController()
  const reason = new DOMException('Page closed', 'AbortError')
  const rejected = assert.rejects(authApi.me(caller.signal), error => error === reason)
  caller.abort(reason)
  await rejected
  assert.equal(requests.length, 1)
})
test('a stalled response body reports a timeout and preserves the session', async t => {
  useMockRequestClock(t)
  saveSession(session)
  globalThis.fetch = async (_url, options) => ({
    ok: true, status: 200,
    json: () => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true })
    }),
  })
  const rejected = assert.rejects(authApi.me(), error => error.code === 'REQUEST_TIMEOUT')
  await Promise.resolve()
  t.mock.timers.tick(90000)
  await rejected
  assert.equal(readStoredUser().id, session.user.id)
})
