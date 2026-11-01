import { useEffect, useState } from 'react'
import { getUnreadCount } from '../../lib/notifications'
import { useAuth } from '../auth/authContext'

export function useUnreadCount() {
  const { user } = useAuth()
  const enabled = user?.role === 'learner' || user?.role === 'admin' // staff get 403
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const poll = () =>
      getUnreadCount()
        .then((r) => {
          if (!cancelled) setUnread(r.unreadCount)
        })
        .catch(() => {})
    poll()
    const timer = setInterval(poll, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') poll()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])

  return { enabled, unread, setUnread }
}