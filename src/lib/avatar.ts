import { apiClient } from './apiClient'

export type AvatarResponse = {
  message: string
  avatarUrl: string
  profile: unknown
  completeness: number
}

export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file) // the key name must be exactly "avatar"
  // Longer timeout: uploads are slower than normal calls, and the Dev server can be slow to wake up
  return apiClient<AvatarResponse>('/api/learner/avatar', {
    method: 'POST',
    body: formData,
    timeoutMs: 60000,
  })
}