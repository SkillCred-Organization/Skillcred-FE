import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Link2, TriangleAlert } from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import InlineAlert from '../../components/ui/InlineAlert'
import Skeleton from '../../components/ui/Skeleton'
import Toggle from '../../components/ui/Toggle'
import { useToast } from '../../components/ui/toastContext'
import { getProfile, getShareSettings, saveShareSettings } from '../../lib/api'
import { errorText } from '../../lib/errors'
import type { ShareSettings } from '../../types'
import { useAuth } from '../auth/authContext'
import HandleEditor from './HandleEditor'

const closed: ShareSettings = { isPublic: false, showPendingAndSelfReported: false, showEmail: false }

const slug = (name = '') =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)

export default function SharePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [handle, setHandle] = useState('')
  const [settings, setSettings] = useState<ShareSettings>(closed)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getProfile(), getShareSettings().catch(() => closed)])
      .then(([{ profile }, share]) => {
        if (cancelled) return
        setHandle(profile?.handle ?? '')
        setSettings(share)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const path = handle ? `/u/${handle}` : ''
  const fullLink = `${window.location.origin}${path}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copied')
    } catch {
      toast.error("Couldn't copy the link. Select it and copy it by hand.")
    }
  }

  async function change(key: keyof ShareSettings, value: boolean) {
    const previous = settings
    setSettings({ ...settings, [key]: value })
    try {
      await saveShareSettings({ [key]: value })
    } catch (err) {
      setSettings(previous)
      toast.error(errorText(err, "Couldn't save that change. Please try again."))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Share your profile</h1>
        <p className="text-sm text-ink-muted">Send this link with job applications. Employers don&apos;t need an account.</p>
      </header>

      {state === 'loading' ? (
        <div role="status" aria-label="Loading" className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : state === 'error' ? (
        <EmptyState
          icon={TriangleAlert}
          title="Something went wrong"
          message="It's on our side. Please try again in a moment."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setState('loading')
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            {handle && !editing ? (
              <>
                <h2 className="mb-3 text-base font-semibold text-ink">Your link</h2>
                <input
                  readOnly
                  value={fullLink}
                  aria-label="Your profile link"
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-11 w-full rounded-lg border border-field-border bg-white px-3 text-sm text-ink"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={copyLink}>
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                  <a
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-brand px-5 text-sm font-medium text-brand hover:bg-cream"
                  >
                    <ExternalLink className="size-4" />
                    Preview
                  </a>
                  <Button variant="ghost" icon={<Link2 className="size-4" />} onClick={() => setEditing(true)}>
                    Change link
                  </Button>
                </div>
                {!settings.isPublic && (
                  <InlineAlert variant="warning" title="Your profile is private" className="mt-4">
                    Anyone who opens this link sees &ldquo;This profile isn&apos;t available&rdquo;. Turn on Public
                    profile below to share it.
                  </InlineAlert>
                )}
              </>
            ) : (
              <HandleEditor
                current={handle}
                suggestion={slug(user?.fullName)}
                onSaved={(h) => {
                  setHandle(h)
                  setEditing(false)
                }}
                onCancel={handle ? () => setEditing(false) : undefined}
              />
            )}
          </section>

          {handle && (
            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="mb-1 text-base font-semibold text-ink">What viewers see</h2>
              <div className="divide-y divide-line">
                <div className="py-3">
                  <Toggle
                    checked={settings.isPublic}
                    onChange={(v) => change('isPublic', v)}
                    label="Public profile"
                    description="Anyone with the link can see it."
                  />
                </div>
                <div className="py-3">
                  <Toggle
                    checked={settings.showPendingAndSelfReported}
                    onChange={(v) => change('showPendingAndSelfReported', v)}
                    label="Show items that aren't verified yet"
                    description="Pending and self-reported items appear with their label."
                  />
                </div>
                <div className="py-3">
                  <Toggle
                    checked={settings.showEmail}
                    onChange={(v) => change('showEmail', v)}
                    label="Show my email"
                    description="Let viewers contact you by email."
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}