import { useEffect, useMemo, useRef, useState } from 'react'
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
   onTextChange?: (text: string) => void
}

// Ignores capital letters, spaces and punctuation, so "altschool" finds "ALT School Academy"
const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '')

export default function InstitutionPicker({
  value,
  onChange,
  error,
  label = 'Institution',
  allowUnlisted = true,
  onTextChange
}: InstitutionPickerProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [all, setAll] = useState<Institution[] | null>(null) // null while loading
  const [remote, setRemote] = useState<Institution[]>([])
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [unlisted, setUnlisted] = useState(allowUnlisted && value !== null && value.id === null)
  const input = useRef<HTMLInputElement>(null)

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
     onTextChange?.(text)
    setQuery(text)
    setOpen(true)
    onChange(unlisted && text.trim() ? { id: null, name: text.trim() } : null)
  }

  function pick(institution: Institution) {
    onTextChange?.(institution.name)
    setQuery(institution.name)
    setOpen(false)
    onChange(institution)
  }

  // The listed institution whose name is exactly what was typed, ignoring case and spacing
  const exact = useMemo(() => matches.find((i) => squash(i.name) === squash(typed)) ?? null, [matches, typed])

  // Typing a full name without tapping it in the list still counts as picking it
  function close() {
    setOpen(false)
    if (!unlisted && exact && value?.id !== exact.id) pick(exact)
  }

  function switchMode(toUnlisted: boolean) {
    setUnlisted(toUnlisted)
    setOpen(false)
    if (toUnlisted) {
      onChange(typed ? { id: null, name: typed } : null)
      if (!typed) input.current?.focus()
    } else {
      onChange(exact)
    }
  }

  return (
    <div>
      {/* The list floats over the page, so opening or closing it never moves the buttons below.
          Otherwise the first tap on them is lost when the list closes under the finger. */}
      <div className="relative">
        <Input
          ref={input}
          label={unlisted ? 'Institution name' : label}
          icon={<Building2 className="size-4" />}
          placeholder={unlisted ? "Type your institution's name" : 'Start typing, for example "alt"'}
          helperText={unlisted ? 'Your work stays Self-reported until they join SkillCred.' : undefined}
          value={query}
          onChange={(e) => handleType(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={close}
          autoComplete="off"
          error={error}
        />

        {open && !unlisted && (
          <ul
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-line bg-white shadow-md"
          >
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
            {/* The list covers the "isn't listed" button below, so offer the same choice here */}
            {allowUnlisted && (
              <li
                role="option"
                aria-selected={false}
                onMouseDown={(e) => {
                  e.preventDefault()
                  switchMode(true)
                }}
                className="sticky bottom-0 cursor-pointer border-t border-line bg-white px-3 py-2.5 text-sm font-medium text-brand hover:bg-cream"
              >
                {typed ? <>Use &ldquo;{typed}&rdquo; as typed (not listed)</> : "My institution isn't listed"}
              </li>
            )}
          </ul>
        )}
      </div>

      {allowUnlisted && (
        <button type="button" onClick={() => switchMode(!unlisted)} className="mt-2 text-sm text-brand underline">
          {unlisted ? 'Pick from the list instead' : "My institution isn't listed"}
        </button>
      )}
    </div>
  )
}