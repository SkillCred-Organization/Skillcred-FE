import type { LucideIcon } from 'lucide-react'

type Tone = 'leaf' | 'apricot' | 'sage' | 'info' | 'plum'

const tones: Record<Tone, string> = {
  leaf: 'bg-verified-bg text-verified-text',
  apricot: 'bg-soft text-brand',
  sage: 'bg-sage-bg text-sage-text',
  info: 'bg-confirmed-bg text-confirmed-text',
  plum: 'bg-plum-bg text-plum-text',
}

type StatCardProps = {
  icon: LucideIcon
  tone: Tone
  value: number
  label: string
  sub: string
}

export default function StatCard({ icon: Icon, tone, value, label, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <span className={`mb-3 flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="size-4" />
      </span>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  )
}
