import { Check, TriangleAlert, X } from 'lucide-react'
import type { ToastKind } from './toastContext'

type ToastProps = {
  kind: ToastKind
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
}

export default function Toast({ kind, message, actionLabel, onAction, onClose }: ToastProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg"
    >
      {kind === 'success' ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
          <Check className="size-3" />
        </span>
      ) : (
        <TriangleAlert className="size-5 shrink-0 text-soft-dark" />
      )}
      <p className="flex-1">{message}</p>
      {actionLabel && (
        <button
          type="button"
          onClick={() => {
            onAction?.()
            onClose()
          }}
          className="shrink-0 font-medium text-accent hover:underline"
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}