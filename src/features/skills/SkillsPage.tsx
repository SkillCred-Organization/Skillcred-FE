import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Star, TriangleAlert, X } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ChoiceChip from '../../components/ui/ChoiceChip'
import EmptyState from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/toastContext'
import { getSkills, saveSkills } from '../../lib/api'
import { errorText } from '../../lib/errors'
import type { SkillItem } from '../../types'

const MAX_SKILLS = 20
type Filter = 'all' | 'verified' | 'self-reported'

export default function SkillsPage() {
  const toast = useToast()
  const [skills, setSkills] = useState<SkillItem[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [text, setText] = useState('')
  const [inputError, setInputError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSkills()
      .then((list) => {
        if (!cancelled) setSkills(list)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  async function update(next: SkillItem[], success: string) {
    setSaving(true)
    try {
      await saveSkills(next.map((s) => s.name))
      setSkills(next)
      toast.success(success)
      return true
    } catch (err) {
      toast.error(errorText(err, "Couldn't save your skills. Please try again."))
      return false
    } finally {
      setSaving(false)
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault()
    const name = text.trim()
    if (!skills) return
    if (!name) {
      setInputError('Type a skill first.')
      return
    }
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setInputError('You already added that skill.')
      return
    }
    if (skills.length >= MAX_SKILLS) {
      setInputError(`You can add up to ${MAX_SKILLS} skills.`)
      return
    }
    const ok = await update([...skills, { name, verified: false }], 'Skill added.')
    if (ok) {
      setText('')
      setInputError('')
    }
  }

  function remove(name: string) {
    if (!skills) return
    void update(skills.filter((s) => s.name !== name), 'Skill removed.')
  }

  const countFor = (f: Filter) =>
    skills ? skills.filter((s) => f === 'all' || (f === 'verified' ? s.verified : !s.verified)).length : undefined
  const visible = (skills ?? []).filter((s) => filter === 'all' || (filter === 'verified' ? s.verified : !s.verified))

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Skills</h1>
        <p className="text-sm text-ink-muted">Skills linked to a verified programme or project show as Verified.</p>
      </header>

      <form onSubmit={add} className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          className="flex-1"
          label="Add a skill"
          placeholder="e.g. Python, Figma, SQL"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setInputError('')
          }}
          error={inputError}
          autoComplete="off"
        />
        <Button type="submit" loading={saving} icon={<Plus className="size-4" />} className="sm:mt-7">
          Add skill
        </Button>
      </form>

      {error ? (
        <EmptyState
          icon={TriangleAlert}
          title="Something went wrong"
          message="It's on our side. Please try again in a moment."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setError(false)
                setSkills(null)
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : skills === null ? (
        <div role="status" aria-label="Loading skills" className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No skills yet"
          message="Skills appear here as you add projects. You can also add skills yourself."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <ChoiceChip label="All" count={countFor('all')} selected={filter === 'all'} onClick={() => setFilter('all')} />
            <ChoiceChip
              label="Verified"
              count={countFor('verified')}
              selected={filter === 'verified'}
              onClick={() => setFilter('verified')}
            />
            <ChoiceChip
              label="Self-reported"
              count={countFor('self-reported')}
              selected={filter === 'self-reported'}
              onClick={() => setFilter('self-reported')}
            />
          </div>
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">No skills with this status.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visible.map((s) => (
                <li key={s.name} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-plum-bg text-plum-text">
                    <Star className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.verified ? 'From your verified work' : 'Added by you'}</p>
                  </div>
                  <Badge status={s.verified ? 'verified' : 'self-reported'} />
                  {!s.verified && (
                    <button
                      type="button"
                      aria-label={`Remove ${s.name}`}
                      disabled={saving}
                      onClick={() => remove(s.name)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}