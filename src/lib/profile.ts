import { apiClient } from './apiClient.ts'

export type LearnerProfile = { handle?: string }
type ProfileResponse = { profile: LearnerProfile | null }

export const learnerProfileApi = {
  get: (signal?: AbortSignal) => apiClient<ProfileResponse>('/api/learner/profile', { signal }),
  handleAvailable: (handle: string) => apiClient<{ available: boolean }>(`/api/learner/handle-available?handle=${encodeURIComponent(handle)}`),
  saveHandle: (handle: string) => apiClient<ProfileResponse>('/api/learner/profile', {
    method: 'PATCH', body: JSON.stringify({ handle }),
  }),
}

export function profileUrl(profile: LearnerProfile | null | undefined): string | null {
  const handle = typeof profile?.handle === 'string' ? profile.handle.trim() : ''
  return handle ? `https://skillcred.app/u/${encodeURIComponent(handle)}` : null
}

export function suggestedProfileHandle(fullName: string): string {
  return fullName.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
