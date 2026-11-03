import { apiClient } from './apiClient'

export type DeleteCodeSent = { sent: boolean; expiresInMinutes: number; email: string }

export const requestDeleteCode = () =>
  apiClient<DeleteCodeSent>('/api/account/delete/request', {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const confirmDelete = (code: string) =>
  apiClient<{ deleted: boolean; message: string }>('/api/account/delete/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })