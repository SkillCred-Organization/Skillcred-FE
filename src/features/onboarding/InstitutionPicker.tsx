import { useEffect, useMemo, useState } from 'react'
import { Building2 } from 'lucide-react'
import Input from '../../components/ui/Input'
import { searchInstitutions } from '../../lib/api'
import type { Institution } from '../../types'

type InstitutionPickerProps = {
  value: Institution | null
  onChange: (value: Institution | null) => void
  error?: string
  label?: string
  allowUnlisted?: boolean
}

// Ignores capital letters, spaces and punctuation, so "altschool" finds "ALT School Academy"
const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')

export default function InstitutionPicker({
  value,
  onChange,
  error,
  label = 'Institution',
  allowUnlisted = true,
}: InstitutionPickerProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [all, setAll] = useState<Institution[] | null>(null) // null while loading
  const [remote, setRemote] = useState<Institution[]>([])
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [unlisted, setUnlisted] = useState(allowUnlisted && value !== null && value.id === null)

  const typed = query.trim()

  // Load the list once. There are only a few approved institutions, so we filter it here.
  useEffect(() => {
    let cancelled = false
    searchInstitutions('')
      .then((list) => {
        if (!cancelled) setAll(list)
      })
      .catch(() => {
        if (!cancelled) {
          setAll([])
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Fallback: if the full list came back empty, ask the server while the learner types.
  useEffect(() => {
    if (unlisted || !open || !typed || all === null || all.length > 0) return
    let cancelled = false
    const timer = setTimeout(() => {
      searchInstitutions(typed)
        .then((found) => {
          if (!cancelled) setRemote(found)
        })
        .catch(() => {
          if (!cancelled) setFailed(true)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [typed, unlisted, open, all])

  const matches = useMemo(() => {
    if (all && all.length > 0) {
      const t = squash(typed)
      return (t ? all.filter((i) => squash(i.name).includes(t)) : all).slice(0, 8)
    }
    return typed ? remote : []
  }, [typed, all, remote])

  function handleType(text: string) {
    setQuery(text)
    setOpen(true)
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
        label={unlisted ? 'Institution name' : label}
        icon={<Building2 className="size-4" />}
        placeholder={unlisted ? "Type your institution's name" : 'Start typing, for example "alt"'}
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
          {all === null && <li className="px-3 py-2 text-sm text-ink-muted">Loading institutions…</li>}
          {matches.map((r) => (
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
          {all !== null && matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-ink-muted">
              {failed
                ? "Couldn't load institutions."
                : typed
                  ? 'No institution matches. Check the spelling.'
                  : 'No institutions available yet.'}
            </li>
          )}
          {allowUnlisted && typed && (
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

      {allowUnlisted && (
        <button type="button" onClick={() => switchMode(!unlisted)} className="mt-2 text-sm text-brand underline">
          {unlisted ? 'Pick from the list instead' : "My institution isn't listed"}
        </button>
      )}
    </div>
  )
}