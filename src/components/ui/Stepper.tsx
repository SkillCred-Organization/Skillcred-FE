import { Check } from 'lucide-react'

export default function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[11px] font-medium ${
                done
                  ? 'bg-accent-dark text-white'
                  : active
                    ? 'bg-brand text-white'
                    : 'border border-field-border text-ink-muted'
              }`}
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <span className={`text-xs ${active ? 'font-medium text-ink' : 'text-ink-muted'}`}>{label}</span>
            {i < steps.length - 1 && <span className={`h-px w-4 sm:w-10 ${done ? 'bg-accent-dark' : 'bg-line'}`} />}
          </li>
        )
      })}
    </ol>
  )
}