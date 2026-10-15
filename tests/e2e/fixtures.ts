import type { Page } from '@playwright/test'
import type { AdminClaim, Institution } from '../../src/lib/admin'

const names = ['Adaeze Okafor', 'Kwame Mensah', 'Fatima Sani', 'Zainab Abdullahi']
export async function mockBackend(page: Page, options: { role?: 'admin' | 'learner'; approved?: boolean; verified?: boolean; owner?: boolean; signedIn?: boolean; conflict?: boolean } = {}) {
  const user = { id: options.role === 'learner' ? 'learner-1' : 'admin-1', fullName: options.role === 'learner' ? 'Munachi David' : 'Tunde Bello', email: options.role === 'learner' ? 'learner@example.test' : 'tunde@lagostech.example.test', role: options.role || 'admin', emailVerified: options.verified !== false, needsInstitution: false, institutionId: 'institution-1', institutionRole: options.owner === false ? 'reviewer' : 'owner' }
  let institution: Institution = { id: 'institution-1', name: 'Lagos Tech Institute', website: 'https://lagostech.example.test', domain: 'lagostech.example.test', about: 'Practical technology programmes for the next generation of builders.', registrationNumber: 'LTI-1234', status: options.approved === false ? 'pending' : 'approved', programmes: [{ name: 'Software Engineering', cohorts: ['2025 Cohort 2'], learners: 3 }, { name: 'Product Design', cohorts: ['2026 Cohort 1'], learners: 1 }] }
  const claims: AdminClaim[] = names.map((name, index) => ({ id: `claim-${index + 1}`, title: ['Inventory tracker', 'Product Design programme', 'Backend Engineering Certificate', 'Payments API capstone'][index], type: index === 1 ? 'programme' : index === 2 ? 'certification' : 'project', status: index < 2 ? 'pending' : index === 2 ? 'needs-changes' : 'verified', summary: 'Stock-tracking API for small shops.', description: null, role: 'Backend lead', track: 'software_engineering', startDate: '2025-03-01', endDate: '2025-05-01', programme: 'Software Engineering', cohort: '2025 Cohort 2', institutionName: institution.name, learner: { id: `learner-${index + 1}`, fullName: name, email: `learner${index}@example.test`, handle: name.toLowerCase().replaceAll(' ', '-') }, evidence: [{ id: 'proof-1', label: 'Repository link', url: 'https://github.com/example/inventory-tracker' }], proofLink: null, teammates: [{ id: 'team-1', name: 'Kwame Mensah', email: null, role: 'Frontend', invitation: 'not_sent' }], waitingDays: index < 2 ? 30 - index * 18 : null, overdue: index < 2, submittedAt: '2026-09-15T09:00:00Z', decision: index < 2 ? null : { outcome: index === 2 ? 'needs-changes' : 'verified', at: '2026-10-02T09:00:00Z', reason: index === 2 ? 'Dates' : null, messageToLearner: index === 2 ? 'Please confirm the end date.' : null, internalNote: null }, history: [] }))
  const writes: { path: string; body: Record<string, unknown>; authorization: string | undefined }[] = []
  let profile = { headline: 'Backend Engineer', location: 'Lagos, Nigeria', handle: 'munachi-david' }
  let token = 'test-only-session'
  if (options.signedIn !== false) await page.addInitScript(({ user, token }) => { localStorage.setItem('auth_token', token); localStorage.setItem('auth_user', JSON.stringify(user)) }, { user, token })
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method()
    const body = request.postDataJSON() || {}
    const json = (value: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(value) })
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } })
    if (method !== 'GET') writes.push({ path, body, authorization: request.headers().authorization })
    if (path === '/api/auth/login') return json({ token, user })
    if (path === '/api/auth/me') return json({ user, institution })
    if (!request.headers().authorization?.startsWith('Bearer ')) return json({ message: 'Please log in.' }, 401)
    if (path === '/api/admin/institution') {
      if (method === 'PATCH') { institution = { ...institution, ...body }; return json({ institution }) }
      return json({ institution, team: [{ ...user, jobTitle: 'Programme lead', status: 'active' }], emailVerified: user.emailVerified, myRole: user.institutionRole })
    }
    const counts = () => ({ pending: claims.filter(c => c.status === 'pending').length, verified: claims.filter(c => c.status === 'verified').length, 'needs-changes': claims.filter(c => c.status === 'needs-changes').length })
    if (path === '/api/admin/dashboard') return json({ pendingClaims: counts().pending, overdueClaims: counts().pending, verified: counts().verified, needsChanges: counts()['needs-changes'], affiliatedLearners: 4, recentDecisions: claims.filter(c => c.decision).map(c => ({ claimId: c.id, title: c.title, type: c.type, outcome: c.status, learnerName: c.learner?.fullName, decidedAt: c.decision?.at })) })
    if (path === '/api/admin/claims') {
      const status = url.searchParams.get('status') || 'pending', q = url.searchParams.get('q')?.toLowerCase() || ''
      const filtered = claims.filter(c => (status === 'all' || c.status === status) && c.learner?.fullName.toLowerCase().includes(q))
      return json({ claims: filtered.slice(0, Number(url.searchParams.get('limit') || 10)), counts: counts(), page: 1, limit: 10, total: filtered.length, totalPages: filtered.length ? 1 : 0 })
    }
    if (path.startsWith('/api/admin/claims/')) {
      const claim = claims.find(c => c.id === path.split('/')[4])
      if (!claim) return json({ message: 'Claim not found' }, 404)
      if (method === 'POST') {
        if (options.conflict || claim.status !== 'pending') { claim.status = 'verified'; return json({ message: 'Already reviewed', code: 'CLAIM_NOT_PENDING' }, 409) }
        claim.status = path.endsWith('/verify') ? 'verified' : 'needs-changes'
        claim.decision = { outcome: claim.status, at: '2026-10-15T12:00:00Z', reason: body.reason || null, messageToLearner: body.message || null, internalNote: null }
      }
      return json({ claim })
    }
    if (path === '/api/admin/learners') return json({ learners: claims.map(c => ({ ...c.learner, programme: c.programme, cohort: c.cohort, status: 'graduated', claims: { verified: c.status === 'verified' ? 1 : 0, pending: c.status === 'pending' ? 1 : 0, needsChanges: c.status === 'needs-changes' ? 1 : 0 } })).filter(learner => learner.fullName?.toLowerCase().includes(url.searchParams.get('q')?.toLowerCase() || '')), page: 1, limit: 100, total: 4, totalPages: 1 })
    if (path === '/api/learner/profile') { if (method === 'PATCH') profile = { ...profile, ...body }; return json({ profile }) }
    if (path === '/api/auth/change-password') { token = 'test-only-rotated-session'; return json({ token, message: 'Password changed' }) }
    if (path === '/api/learner/export') return json({ user, profile, claims: [] })
    return json({ message: `Unmocked endpoint: ${method} ${path}` }, 404)
  })
  return { writes, claims, user }
}
