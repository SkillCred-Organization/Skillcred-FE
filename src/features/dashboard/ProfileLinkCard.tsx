import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { ApiError } from '../../lib/apiClient'
import { learnerProfileApi, profileUrl, suggestedProfileHandle, type LearnerProfile } from '../../lib/profile'

export default function ProfileLinkCard({ fullName }: { fullName: string }) {
  const [profile, setProfile] = useState<LearnerProfile | null>()
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [handle, setHandle] = useState(() => suggestedProfileHandle(fullName))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const url = profileUrl(profile)

  useEffect(() => {
    const controller = new AbortController()
    learnerProfileApi.get(controller.signal).then(result => {
      if (!controller.signal.aborted) setProfile(result.profile)
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError('We could not load your profile link. Please try again.')
    })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyLink() {
    if (!url) return
    setError('')
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setError('Could not copy the link. Select the address above to copy it manually.')
    }
  }

  async function saveHandle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextHandle = handle.trim().toLowerCase()
    if (!nextHandle) { setError('Choose a profile handle.'); return }
    setSaving(true)
    setError('')
    try {
      const availability = await learnerProfileApi.handleAvailable(nextHandle)
      if (!availability.available) { setError('That handle is already taken. Try another.'); return }
      await learnerProfileApi.saveHandle(nextHandle)
      const result = await learnerProfileApi.get()
      if (!profileUrl(result.profile)) throw new Error('Your profile link is not available yet. Please try again.')
      setProfile(result.profile)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setError('That handle is already taken. Try another.')
      else if (cause instanceof ApiError && cause.fieldErrors?.handle?.[0]) setError(cause.fieldErrors.handle[0])
      else setError(cause instanceof Error ? cause.message : 'Could not save your profile link. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="rounded-xl border border-line bg-white p-4" aria-labelledby="profile-link-title">
    <h2 id="profile-link-title" className="mb-1 text-base font-semibold text-ink">Your profile link</h2>
    {loadError ? <>
      <p role="alert" className="mb-3 text-sm text-error">{loadError}</p>
      <Button size="sm" variant="outline" onClick={() => { setLoadError(''); setAttempt(value => value + 1) }}>Retry</Button>
    </> : profile === undefined ? <p role="status" className="text-sm text-ink-muted">Loading your profile link...</p>
      : url ? <>
        <p className="mb-3 text-sm text-ink-muted">Your profile address is linked to your account.</p>
        <input readOnly value={url.replace(/^https:\/\//, '')} aria-label="Your profile link"
          className="mb-3 h-10 w-full rounded-lg border border-field-border bg-white px-3 text-sm text-ink" />
        <Button size="sm" onClick={copyLink} icon={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
      </> : <form onSubmit={saveHandle} aria-busy={saving}>
        <p className="mb-3 text-sm text-ink-muted">Choose a unique handle for your profile link.</p>
        <Input label="Profile handle" value={handle} onChange={event => { setHandle(event.target.value); setError('') }}
          autoCapitalize="none" autoComplete="off" spellCheck={false} disabled={saving} error={error}
          helperText="For example, your name with hyphens between words." />
        <Button type="submit" size="sm" className="mt-3" loading={saving}>{saving ? 'Saving...' : 'Save profile link'}</Button>
      </form>}
  </section>
}
