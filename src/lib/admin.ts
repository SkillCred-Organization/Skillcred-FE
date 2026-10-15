import { apiClient } from './apiClient.ts'

export type ReviewStatus = 'pending' | 'verified' | 'needs-changes'
export type InstitutionStatus = 'pending' | 'approved' | 'rejected'
export type InstitutionSummary = { id: string; name: string; status: InstitutionStatus }
export type Programme = { name: string; cohorts: string[]; learners?: number }
export type Institution = InstitutionSummary & {
  website: string; domain: string; about: string | null; registrationNumber: string | null
  programmes: Programme[]; learnerCount?: number
}
export type InstitutionMember = {
  id: string; fullName: string; email: string; jobTitle: string | null
  institutionRole: 'owner' | 'reviewer' | null; status: string
}
export type InstitutionResponse = {
  institution: Institution; team: InstitutionMember[]; emailVerified: boolean; myRole: 'owner' | 'reviewer' | null
}
export type AdminClaim = {
  id: string; type: 'project' | 'programme' | 'certification' | 'achievement'; status: ReviewStatus
  title: string | null; summary: string | null; description: string | null; role: string | null
  track: string | null; startDate: string | null; endDate: string | null
  programme: string | null; cohort: string | null; institutionName: string | null
  learner: { id: string; fullName: string; email: string; handle: string | null } | null
  evidence: { id: string; label: string; url: string }[]; proofLink: string | null
  teammates: { id: string; name: string | null; email: string | null; role: string | null; invitation: string }[]
  waitingDays: number | null; overdue: boolean; submittedAt: string | null
  decision: { outcome: ReviewStatus; reason: string | null; messageToLearner: string | null; internalNote: string | null; at: string } | null
  history: { at: string; action: string; actorRole: string | null; note: string | null }[]
}
export type QueueResponse = {
  claims: AdminClaim[]; counts: Record<ReviewStatus, number>; page: number; limit: number; total: number; totalPages: number
}
export type DashboardResponse = {
  pendingClaims: number; overdueClaims: number; verified: number; needsChanges: number; affiliatedLearners: number
  recentDecisions: { claimId: string; title: string; type: string; outcome: ReviewStatus; learnerName: string | null; decidedAt: string | null }[]
}
export type AdminLearner = {
  id: string; fullName: string | null; email: string | null; handle: string | null
  programme: string | null; cohort: string | null; status: string | null
  claims: { verified: number; pending: number; needsChanges: number }
}
export type LearnersResponse = { learners: AdminLearner[]; page: number; limit: number; total: number; totalPages: number }
export type QueueFilters = { status?: ReviewStatus | 'all'; q?: string; page?: number; limit?: number; sort?: 'oldest' | 'newest' }

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') params.set(key, String(value))
  return params.size ? `?${params}` : ''
}
const post = <T>(path: string, body: unknown) => apiClient<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const adminApi = {
  institution: (signal?: AbortSignal) => apiClient<InstitutionResponse>('/api/admin/institution', { signal }),
  dashboard: (signal?: AbortSignal) => apiClient<DashboardResponse>('/api/admin/dashboard', { signal }),
  queue: (filters: QueueFilters = {}, signal?: AbortSignal) => apiClient<QueueResponse>(`/api/admin/claims${query(filters)}`, { signal }),
  claim: (id: string, signal?: AbortSignal) => apiClient<{ claim: AdminClaim }>(`/api/admin/claims/${encodeURIComponent(id)}`, { signal }),
  verify: (id: string) => post<{ claim: AdminClaim }>(`/api/admin/claims/${encodeURIComponent(id)}/verify`, {}),
  requestChanges: (id: string, reason: string, message: string) => post<{ claim: AdminClaim }>(`/api/admin/claims/${encodeURIComponent(id)}/request-changes`, { reason: reason.trim(), message: message.trim() }),
  learners: (filters: { q?: string; page?: number; limit?: number } = {}, signal?: AbortSignal) => apiClient<LearnersResponse>(`/api/admin/learners${query(filters)}`, { signal }),
  saveInstitution: (values: { name?: string; about?: string; registrationNumber?: string; programmes?: Pick<Programme, 'name' | 'cohorts'>[] }) => apiClient<{ institution: Institution }>('/api/admin/institution', { method: 'PATCH', body: JSON.stringify(values) }),
  registerInstitution: (values: { institutionName: string; website: string; registrationNumber?: string; jobTitle: string; authorised: true }) => post<{ institution: InstitutionSummary }>('/api/admin/institution', values),
}

// The server scopes all results to the admin's institution. Filter by ID as names are not unique.
export async function learnerClaims(learner: AdminLearner, signal?: AbortSignal) {
  const claims: AdminClaim[] = []
  let page = 1
  let totalPages: number
  do {
    const result = await adminApi.queue({ status: 'all', q: learner.fullName ?? '', page, limit: 100 }, signal)
    claims.push(...result.claims.filter(claim => claim.learner?.id === learner.id))
    totalPages = result.totalPages
    page += 1
  } while (page <= totalPages)
  return claims
}

export function safeEvidenceUrl(value: string): string | null {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null }
  catch { return null }
}

export function initials(name: string | null | undefined) {
  return (name?.trim() || 'Your account').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

export function reviewDate(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

export function waitingLabel(days: number | null) {
  return days === null ? '' : days < 1 ? 'today' : `waiting ${days} ${days === 1 ? 'day' : 'days'}`
}
