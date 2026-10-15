import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  onClose: () => void
  header?: ReactNode
  footer: ReactNode
  children: ReactNode
  compact?: boolean
}

export default function Modal({ title, onClose, header, footer, children, compact = false }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current() }
      if (e.key === 'Tab') {
        const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0)
        const first = elements[0], last = elements.at(-1)
        if (!first) { e.preventDefault(); return }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden' // stop the page scrolling behind the modal
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [])

  return (
    <div className={`fixed inset-0 z-[100] flex justify-center bg-ink/50 sm:items-center sm:p-4 ${compact ? 'items-end' : 'items-stretch'}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialog}
        tabIndex={-1}
        className={`flex w-full flex-col bg-white outline-none sm:rounded-2xl sm:shadow-xl ${compact ? 'max-h-[90dvh] rounded-t-3xl sm:max-w-[480px]' : 'sm:max-h-[90vh] sm:max-w-[640px]'}`}
      >
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
            >
              <X className="size-4" />
            </button>
          </div>
          {header && <div className="mt-3">{header}</div>}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  )
}
