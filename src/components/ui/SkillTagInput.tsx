import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import Input from './Input'

type SkillTagInputProps = {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  suggestions?: string[]
  helperText?: string
}

export default function SkillTagInput({ label, value, onChange, suggestions = [], helperText }: SkillTagInputProps) {
  const [text, setText] = useState('')

  function add(raw: string) {
    // commas let someone type several skills at once
    const names = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (names.length === 0) return
    const next = [...value]
    for (const name of names) {
      if (!next.some((s) => s.toLowerCase() === name.toLowerCase())) next.push(name)
    }
    onChange(next)
    setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(text)
    }
  }

  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 8)

  return (
    <div>
      <Input
        label={label}
        placeholder="Type a skill and press Enter"
        helperText={helperText}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(text)}
        autoComplete="off"
      />
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {value.map((s) => (
            <li key={s}>
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => onChange(value.filter((v) => v !== s))}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-brand pl-3 pr-2 text-xs font-medium text-white hover:bg-brand-dark"
              >
                {s}
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {unused.length > 0 && (
        <>
          <p className="mb-2 mt-4 text-xs text-ink-muted">Suggestions</p>
          <ul className="flex flex-wrap gap-2">
            {unused.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => add(s)}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-field-border px-3 text-xs text-ink hover:bg-cream"
                >
                  {s}
                  <Plus className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}