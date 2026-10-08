import { Clock, Pencil, ShieldCheck, TriangleAlert, User, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Status } from '../../types'

const config: Record<Status, { label: string; icon: LucideIcon; style: string }> = {
  verified: { label: 'Verified', icon: ShieldCheck, style: 'bg-verified-bg text-verified-text' },
  'team-confirmed': { label: 'Team-confirmed', icon: Users, style: 'bg-confirmed-bg text-confirmed-text' },
  pending: { label: 'Pending', icon: Clock, style: 'bg-pending-bg text-pending-text' },
  'needs-changes': { label: 'Needs changes', icon: TriangleAlert, style: 'bg-changes-bg text-changes-text' },
  'self-reported': { label: 'Self-reported', icon: User, style: 'bg-self-bg text-self-text' },
  draft: { label: 'Draft', icon: Pencil, style: 'border border-line-strong bg-white text-ink-muted' },
}

type BadgeProps = { status: Status; className?: string }

export default function Badge({ status, className = '' }: BadgeProps) {
  const { label, icon: Icon, style } = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style} ${className}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}