import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'accent' | 'soft' | 'outline' | 'ghost'
type Size = 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-deep focus-visible:ring-offset-2'

const sizes: Record<Size, string> = {
  md: 'h-10 px-5 text-sm',
  sm: 'h-8 px-4 text-xs',
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  accent: 'bg-accent text-ink hover:bg-accent-dark',
  soft: 'bg-soft text-brand hover:bg-soft-dark',
  outline: 'border border-brand text-brand hover:bg-cream',
  ghost: 'text-brand hover:bg-cream',
}

const disabledStyles: Record<Variant, string> = {
  primary: 'bg-sand text-ink-muted/50 cursor-not-allowed',
  accent: 'bg-sand text-ink-muted/50 cursor-not-allowed',
  soft: 'bg-sand text-ink-muted/50 cursor-not-allowed',
  outline: 'border border-line-strong text-ink-muted/50 cursor-not-allowed',
  ghost: 'text-ink-muted/50 cursor-not-allowed',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const style = disabled ? disabledStyles[variant] : variants[variant]

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${style} ${loading ? 'cursor-wait' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}