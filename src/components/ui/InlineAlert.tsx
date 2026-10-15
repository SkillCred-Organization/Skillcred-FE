import { Check, Info, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Variant = 'info' | 'success' | 'warning' | 'error'

const variants: Record<Variant, { box: string; icon: LucideIcon }> = {
  info: { box: 'border-confirmed-text/20 bg-confirmed-bg text-confirmed-text', icon: Info },
  success: { box: 'border-banner-line bg-banner text-verified-text', icon: Check },
  warning: { box: 'border-line bg-pending-bg text-pending-text', icon: TriangleAlert },
  error: { box: 'border-error/30 bg-changes-bg text-changes-text', icon: TriangleAlert },
}

type InlineAlertProps = {
  variant: Variant
  title: string
  children?: ReactNode
  actionLabel?: string
  onAction?: () => void
  icon?: LucideIcon
  className?: string
}

export default function InlineAlert({
  variant,
  title,
  children,
  actionLabel,
  onAction,
  icon,
  className = '',
}: InlineAlertProps) {
  const { box, icon: DefaultIcon } = variants[variant]
  const Icon = icon ?? DefaultIcon
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${box} ${className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children && <p className="mt-0.5 opacity-90">{children}</p>}
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} className="shrink-0 font-medium underline">
          {actionLabel}
        </button>
      )}
    </div>
  )
}