import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = { icon: LucideIcon; title: string; message: string; action?: ReactNode }

export default function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-line bg-white px-6 py-12 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-soft text-brand">
        <Icon className="size-5" />
      </span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-ink-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}