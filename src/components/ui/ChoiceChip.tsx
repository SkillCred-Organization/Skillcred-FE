import { Check } from 'lucide-react'

type ChoiceChipProps = { label: string; count?: number; selected: boolean; onClick: () => void }

export default function ChoiceChip({ label, count, selected, onClick }: ChoiceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
        selected ? 'border-accent-dark bg-accent-light text-ink' : 'border-field-border bg-white text-ink hover:bg-cream'
      }`}
    >
      {selected && <Check className="size-3.5" />}
      {label}
      {count !== undefined && <span className="text-ink-muted">{count}</span>}
    </button>
  )
}
