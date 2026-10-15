import { apiClient, ApiError, tokenStore } from './apiClient.ts'

export type AccountProfile = { headline: string | null; location: string | null; handle?: string | null }

export const settingsApi = {
  profile: (signal?: AbortSignal) => apiClient<{ profile: AccountProfile | null }>('/api/learner/profile', { signal }),
  saveProfile: (values: { headline: string; location: string }) => apiClient<{ profile: AccountProfile }>('/api/learner/profile', { method: 'PATCH', body: JSON.stringify(values) }),
  exportData: () => apiClient<Record<string, unknown>>('/api/learner/export'),
  changePassword: async (currentPassword: string, newPassword: string) => {
    const oldToken = tokenStore.get()
    const result = await apiClient<{ token: string; message?: string }>('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }), timeoutMs: 90000 })
    if (typeof result.token !== 'string' || !result.token) throw new ApiError(200, 'The server did not return your new session. Please log in again.')
    if (tokenStore.get() === oldToken) tokenStore.set(result.token)
    return result
  },
}
