import { useId } from 'react'
import type { ComponentProps } from 'react'
import { TriangleAlert } from 'lucide-react'

type TextareaProps = ComponentProps<'textarea'> & {
  label: string
  helperText?: string
  error?: string
}

export default function Textarea({ label, helperText, error, className = '', ...rest }: TextareaProps) {
  const id = useId()
  const messageId = error ? `${id}-error` : helperText ? `${id}-help` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-placeholder ${
          error
            ? 'border-error focus:ring-4 focus:ring-error/15'
            : 'border-field-border focus:border-accent-dark focus:ring-4 focus:ring-accent-soft'
        }`}
        {...rest}
      />
      {error ? (
        <p id={messageId} className="mt-1.5 flex items-center gap-1 text-xs text-error">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      ) : (
        helperText && (
          <p id={messageId} className="mt-1.5 text-xs text-ink-muted">
            {helperText}
          </p>
        )
      )}
    </div>
  )
}