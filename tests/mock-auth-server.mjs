// Local UI test fixture only. Run explicitly; never imported by the application.
import http from 'node:http'
const user = { id: 'fixture-user', fullName: 'Test Learner', email: 'learner@example.test', role: 'learner', emailVerified: true, needsInstitution: false }
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  let raw = ''
  for await (const chunk of req) raw += chunk
  const body = raw ? JSON.parse(raw) : {}
  const path = req.url.split('?')[0]
  function send(status, response) { res.writeHead(status); res.end(JSON.stringify(response)) }
  if (path === '/api/auth/me') { if (req.headers.authorization !== 'Bearer local-ui-fixture-token') { send(503, { message: 'Local test fixture: real accounts are not supported.' }); return } send(200, { user }); return }
  if (body.email && !body.email.endsWith('@example.test')) { send(503, { message: 'Local test fixture: real accounts are not supported.' }); return }
  // Delay exposes the Figma submitting state without production-only delays.
  await new Promise(resolve => setTimeout(resolve, 1600))
  if (path === '/api/auth/login') {
    if (body.password === 'WrongPass123') { send(401, { message: 'Invalid credentials' }); return }
    send(200, { token: 'local-ui-fixture-token', user }); return
  }
  if (path === '/api/auth/register/admin') {
    if (body.website.includes('exists')) { send(409, { code: 'INSTITUTION_EXISTS', message: 'This institution is already registered.' }); return }
    if (body.email.includes('free@')) { send(400, { code: 'FREE_EMAIL', message: 'Use your work email.' }); return }
    send(201, { token: 'local-ui-fixture-token', user: { ...user, role: 'admin', email: body.email, emailVerified: false }, institution: { id: 'test', name: body.institutionName, status: 'pending' } }); return
  }
  if (path === '/api/auth/register/learner') {
    if (body.email === 'taken@example.test') { send(400, { message: 'Validation failed', errors: { email: ['This email is already in use.'] } }); return }
    send(201, { token: 'local-ui-fixture-token', user: { ...user, email: body.email, emailVerified: false } }); return
  }
  if (path === '/api/auth/forgot-password' || path === '/api/auth/resend-verification') { send(200, { message: 'If an account exists, we sent a link.' }); return }
  if (path === '/api/auth/reset-password') {
    if (body.token !== 'local-ui-test-token') { send(400, { code: 'RESET_LINK_INVALID', message: 'This link expired.' }); return }
    send(200, { message: 'Password updated.' }); return
  }
  if (path === '/api/auth/verify-email') { send(200, { message: 'Email verified' }); return }
  send(404, { message: 'Unknown fixture endpoint' })
})
server.listen(4000, '127.0.0.1', () => console.log('Local auth UI fixture ready on http://localhost:4000 (no real accounts or emails).'))
