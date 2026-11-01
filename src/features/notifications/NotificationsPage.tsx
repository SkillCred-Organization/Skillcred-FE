import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Building2, Info, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { getNotifications, markAllRead, markRead, notificationTarget, timeAgo } from '../../lib/notifications'
import type { AppNotification } from '../../lib/notifications'

const iconFor: Record<string, { icon: LucideIcon; style: string }> = {
  'verification.verified': { icon: ShieldCheck, style: 'bg-verified-bg text-verified-text' },
  'verification.changes_requested': { icon: TriangleAlert, style: 'bg-changes-bg text-changes-text' },
  'verification.requested': { icon: Users, style: 'bg-confirmed-bg text-confirmed-text' },
  'institution.approved': { icon: Building2, style: 'bg-verified-bg text-verified-text' },
  'institution.rejected': { icon: Building2, style: 'bg-changes-bg text-changes-text' },
}
const defaultIcon = { icon: Info, style: 'bg-sand text-ink-muted' }

type State = 'loading' | 'ready' | 'error'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [state, setState] = useState<State>('loading')
  const [more, setMore] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getNotifications(1)
      .then((r) => {
        if (cancelled) return
        setItems(r.notifications)
        setUnread(r.unreadCount)
        setPage(r.page)
        setTotalPages(r.totalPages)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  async function loadMore() {
    setMore(true)
    try {
      const r = await getNotifications(page + 1)
      setItems((list) => [...list, ...r.notifications])
      setPage(r.page)
      setTotalPages(r.totalPages)
      setUnread(r.unreadCount)
    } catch {
      /* the button stays, so they can try again */
    } finally {
      setMore(false)
    }
  }

  async function readAll() {
    try {
      const r = await markAllRead()
      setUnread(r.unreadCount)
      setItems((list) => list.map((x) => ({ ...x, read: true })))
    } catch {
      /* leave as is */
    }
  }

  function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      markRead(n.id)
        .then((r) => setUnread(r.unreadCount))
        .catch(() => {})
    }
    const target = notificationTarget(n)
    if (target) navigate(target)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Notifications</h1>
          <p className="text-sm text-ink-muted">Updates about your work and verification.</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={readAll}>
            Mark all as read
          </Button>
        )}
      </header>

      {state === 'loading' && (
        <div role="status" aria-label="Loading notifications" className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      )}

      {state === 'error' && (
        <EmptyState
          icon={TriangleAlert}
          title="Something went wrong"
          message="We couldn't load your notifications. Please try again."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setState('loading')
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      )}

      {state === 'ready' && items.length === 0 && (
        <EmptyState icon={Bell} title="Nothing here yet" message="You'll see updates here when something happens." />
      )}

      {state === 'ready' && items.length > 0 && (
        <>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {items.map((n) => {
              const { icon: Icon, style } = iconFor[n.type] ?? defaultIcon
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-cream ${n.read ? '' : 'bg-cream/60'}`}
                  >
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${style}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">{n.title}</span>
                      {n.body && <span className="mt-0.5 block text-xs text-ink-muted">{n.body}</span>}
                      <span className="mt-1 block text-xs text-ink-muted">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-error" />}
                  </button>
                </li>
              )
            })}
          </ul>
          {page < totalPages && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" loading={more} onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}