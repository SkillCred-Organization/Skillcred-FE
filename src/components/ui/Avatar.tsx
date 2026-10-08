type AvatarProps = {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'apricot' | 'sage' | 'leaf'
  className?: string
}

const sizes = { sm: 'size-6 text-[10px]', md: 'size-8 text-xs', lg: 'size-12 text-base' }
const tones = {
  apricot: 'bg-soft text-brand',
  sage: 'bg-banner text-accent-deep',
  leaf: 'bg-accent-soft text-accent-deep',
}

export default function Avatar({ initials, size = 'md', tone = 'apricot', className = '' }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${sizes[size]} ${tones[tone]} ${className}`}
    >
      {initials}
    </span>
  )
}