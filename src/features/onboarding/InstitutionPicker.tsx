import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import Input from '../../components/ui/Input'
import { searchInstitutions } from '../../lib/api'
import type { Institution } from '../../types'

type InstitutionPickerProps = {
  value: Institution | null
  onChange: (value: Institution | null) => void
  error?: string
}

export default function InstitutionPicker({ value, onChange, error }: InstitutionPickerProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<Institution[]>([])
  const [open, setOpen] = useState(false)
  const [unlisted, setUnlisted] = useState(value !== null && value.id === null)
  const [failed, setFailed] = useState(false)

  const typed = query.trim()
  const shown = typed ? results : []

  useEffect(() => {
    if (unlisted || !open || !typed) return
    let cancelled = false
    const timer = setTimeout(() => {
      searchInstitutions(typed)
        .then((found) => {
          if (!cancelled) {
            setResults(found)
            setFailed(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([])
            setFailed(true)
          }
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [typed, unlisted, open])

  function handleType(text: string) {
    setQuery(text)
    setOpen(true)
    // Typing a name by hand counts as "not listed". Otherwise they must pick from the list.
    onChange(unlisted && text.trim() ? { id: null, name: text.trim() } : null)
  }

  function pick(institution: Institution) {
    setQuery(institution.name)
    setOpen(false)
    onChange(institution)
  }

  function keepTyped() {
    setUnlisted(true)
    setOpen(false)
    onChange({ id: null, name: typed })
  }

  function switchMode(toUnlisted: boolean) {
    setUnlisted(toUnlisted)
    setOpen(false)
    onChange(toUnlisted && typed ? { id: null, name: typed } : null)
  }

  return (
    <div>
      <Input
        label={unlisted ? 'Institution name' : 'Institution'}
        icon={<Building2 className="size-4" />}
        placeholder={unlisted ? "Type your institution's name" : 'Search for your institution'}
        helperText={unlisted ? 'Your work stays Self-reported until they join SkillCred.' : undefined}
        value={query}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        autoComplete="off"
        error={error}
      />

      {open && !unlisted && (
        <ul role="listbox" className="mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-line bg-white shadow-sm">
          {shown.map((r) => (
            <li
              key={r.id}
              role="option"
              aria-selected={value?.id === r.id}
              // onMouseDown runs before the input loses focus, so the click isn't lost
              onMouseDown={(e) => {
                e.preventDefault()
                pick(r)
              }}
              className="cursor-pointer px-3 py-2 text-sm text-ink hover:bg-cream"
            >
              {r.name}
            </li>
          ))}
          {shown.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-muted">
              {!typed
                ? "Start typing your institution's name."
                : failed
                  ? "Couldn't load institutions."
                  : 'No match yet. Try fewer letters.'}
            </li>
          )}
          {typed && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault()
                keepTyped()
              }}
              className="cursor-pointer border-t border-line px-3 py-2 text-sm font-medium text-brand hover:bg-cream"
            >
              Use &ldquo;{typed}&rdquo; as typed (not listed)
            </li>
          )}
        </ul>
      )}

      <button type="button" onClick={() => switchMode(!unlisted)} className="mt-2 text-sm text-brand underline">
        {unlisted ? 'Pick from the list instead' : "My institution isn't listed"}
      </button>
    </div>
  )
}