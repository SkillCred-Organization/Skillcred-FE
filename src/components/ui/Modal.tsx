import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  title: string
  onClose: () => void
  header?: ReactNode
  footer: ReactNode
  children: ReactNode
}

export default function Modal({ title, onClose, header, footer, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden' // stop the page scrolling behind the modal
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex items-stretch justify-center bg-ink/50 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full flex-col bg-white sm:max-h-[90vh] sm:max-w-[640px] sm:rounded-2xl sm:shadow-xl"
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
        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">{footer}</div>
      </div>
    </div>
  )
}
