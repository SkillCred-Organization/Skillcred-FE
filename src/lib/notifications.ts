import { apiClient } from './apiClient'

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown>
  read: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationList = {
  notifications: AppNotification[]
  unreadCount: number
  total: number
  page: number
  limit: number
  totalPages: number
}

export type NotificationSettings = { email: { verification: boolean } }

export const getUnreadCount = () => apiClient<{ unreadCount: number }>('/api/notifications/unread-count')

export const getNotifications = (page = 1, limit = 20) =>
  apiClient<NotificationList>(`/api/notifications?page=${page}&limit=${limit}`)

export const markRead = (id: string) =>
  apiClient<{ notification: AppNotification; unreadCount: number }>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    { method: 'POST', body: JSON.stringify({}) },
  )

export const markAllRead = () =>
  apiClient<{ updated: number; unreadCount: number }>('/api/notifications/read-all', {
    method: 'POST',
    body: JSON.stringify({}),
  })

export const getNotificationSettings = () =>
  apiClient<{ settings: NotificationSettings }>('/api/notifications/settings')

export const updateNotificationSettings = (verification: boolean) =>
  apiClient<{ settings: NotificationSettings }>('/api/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify({ email: { verification } }),
  })

const str = (v: unknown) => (typeof v === 'string' ? v : '')

// Where a notification should lead. Unknown types return null (the row just marks as read).
export function notificationTarget(n: AppNotification): string | null {
  const claimId = str(n.data.claimId)
  const claimType = str(n.data.claimType)
  switch (n.type) {
    case 'verification.verified':
    case 'verification.changes_requested':
      if (claimType === 'project' && claimId) return `/app/projects/${claimId}`
      if (claimType === 'certification') return '/app/certifications'
      if (claimType === 'achievement') return '/app/achievements'
      return '/app/verification'
    case 'verification.requested':
      return claimId ? `/admin/claims/${claimId}` : '/admin/queue'
    case 'institution.approved':
    case 'institution.rejected':
      return '/admin/institution'
    default:
      return null
  }
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ''
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}