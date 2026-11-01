import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Building2, Info, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getNotifications,
  markAllRead,
  markRead,
  notificationTarget,
  timeAgo,
} from '../../lib/notifications'
import type { AppNotification } from '../../lib/notifications'
import { useUnreadCount } from './useUnreadCount'

const iconFor: Record<string, { icon: LucideIcon; style: string }> = {
  'verification.verified': { icon: ShieldCheck, style: 'bg-verified-bg text-verified-text' },
  'verification.changes_requested': { icon: TriangleAlert, style: 'bg-changes-bg text-changes-text' },
  'verification.requested': { icon: Users, style: 'bg-confirmed-bg text-confirmed-text' },
  'institution.approved': { icon: Building2, style: 'bg-verified-bg text-verified-text' },
  'institution.rejected': { icon: Building2, style: 'bg-changes-bg text-changes-text' },
}
const defaultIcon = { icon: Info, style: 'bg-sand text-ink-muted' }

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export default function NotificationBell() {
  const navigate = useNavigate()
  const { enabled, unread, setUnread } = useUnreadCount()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const box = useRef<HTMLDivElement>(null)

  async function load() {
    setState('loading')
    try {
      const r = await getNotifications()
      setItems(r.notifications)
      setUnread(r.unreadCount)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) void load()
  }

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      markRead(n.id)
        .then((r) => setUnread(r.unreadCount))
        .catch(() => {})
    }
    const target = notificationTarget(n)
    setOpen(false)
    if (target) navigate(target)
  }

  async function readAll() {
    try {
      const r = await markAllRead()
      setUnread(r.unreadCount)
      setItems((list) => list.map((x) => ({ ...x, read: true })))
    } catch {
      /* leave as is; the next poll corrects the count */
    }
  }

  if (!enabled) return null

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={toggle}
        className="relative flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink-muted hover:bg-cream"
      >
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-error" />}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="text-xs font-medium text-brand underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {state === 'loading' && <p className="px-4 py-6 text-center text-sm text-ink-muted">Loading…</p>}
            {state === 'error' && (
              <div className="px-4 py-6 text-center text-sm text-ink-muted">
                <p>Couldn&apos;t load your notifications.</p>
                <button type="button" onClick={load} className="mt-2 font-medium text-brand underline">
                  Try again
                </button>
              </div>
            )}
            {state === 'ready' && items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">
                Nothing yet. You&apos;ll see updates here when something happens.
              </p>
            )}
            {state === 'ready' && items.length > 0 && (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const { icon: Icon, style } = iconFor[n.type] ?? defaultIcon
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-cream ${n.read ? '' : 'bg-cream/60'}`}
                      >
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${style}`}>
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}