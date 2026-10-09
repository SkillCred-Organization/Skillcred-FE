import { useId } from 'react'
import type { ComponentProps } from 'react'
import { ChevronDown, TriangleAlert } from 'lucide-react'

type SelectProps = ComponentProps<'select'> & {
  label: string
  placeholder: string
  error?: string
}

export default function Select({ label, placeholder, error, className = '', children, ...rest }: SelectProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          defaultValue=""
          className={`h-11 w-full appearance-none rounded-lg border bg-white pl-3 pr-10 text-sm text-ink outline-none transition-colors ${
            error
              ? 'border-error focus:ring-4 focus:ring-error/15'
              : 'border-field-border focus:border-accent-dark focus:ring-4 focus:ring-accent-soft'
          }`}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-error">
          <TriangleAlert className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}