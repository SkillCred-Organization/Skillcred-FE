import { useId, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { Eye, EyeOff, TriangleAlert } from 'lucide-react'

type InputProps = ComponentProps<'input'> & {
  label: string
  helperText?: string
  error?: string
  icon?: ReactNode
}

export default function Input({
  label,
  helperText,
  error,
  icon,
  type = 'text',
  className = '',
  ...rest
}: InputProps) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const messageId = error ? `${id}-error` : helperText ? `${id}-help` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {icon}
          </span>
        )}

        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={[
            'h-11 w-full rounded-lg border bg-white text-sm text-ink outline-none transition-colors',
            'placeholder:text-placeholder',
            icon ? 'pl-10' : 'pl-3',
            isPassword ? 'pr-11' : 'pr-3',
            error
              ? 'border-error focus:ring-4 focus:ring-error/15'
              : 'border-field-border focus:border-accent-dark focus:ring-4 focus:ring-accent-soft',
            'disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-muted/60',
          ].join(' ')}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>

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