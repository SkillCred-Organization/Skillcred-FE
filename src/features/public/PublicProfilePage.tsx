import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Mail, MapPin, ShieldCheck, TriangleAlert } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { getPublicProfile } from '../../lib/api'
import { ApiError } from '../../lib/apiClient'
import type { PublicItem, PublicProfile } from '../../types'

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

function Section({ title, items }: { title: string; items: PublicItem[] }) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0 flex-1 basis-48">
              <p className="font-medium text-ink">{item.title}</p>
              {item.summary && <p className="text-sm text-ink-muted">{item.summary}</p>}
              {item.verifiedBy && <p className="text-xs text-ink-muted">Verified by {item.verifiedBy}</p>}
            </div>
            <Badge status={item.status} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function PublicProfilePage() {
  const { handle = '' } = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getPublicProfile(handle)
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setState('ready')
      })
      .catch((err) => {
        if (!cancelled) setState(err instanceof ApiError && err.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [handle, attempt])

  const firstName = profile?.fullName.split(' ')[0] || 'the learner'

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/">
            <img src="/logo.svg" alt="SkillCred" className="h-6" />
          </Link>
          <Link to="/user-type" className="text-sm font-medium text-brand hover:underline">
            Create your own
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {state === 'loading' ? (
          <div role="status" aria-label="Loading profile" className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : state === 'missing' ? (
          <EmptyState
            icon={ShieldCheck}
            title="This profile isn't available"
            message="It may be private, or the link may be wrong."
            action={
              <Link
                to="/"
                className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Go to SkillCred
              </Link>
            }
          />
        ) : state === 'error' || !profile ? (
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
          <>
            <section className="rounded-xl border border-line bg-white p-5">
              <div className="flex items-start gap-4">
                <Avatar initials={initials(profile.fullName)} size="lg" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold text-ink">{profile.fullName}</h1>
                  {profile.headline && <p className="text-sm text-ink">{profile.headline}</p>}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {profile.location}
                      </span>
                    )}
                    {profile.institution && <span>{profile.institution}</span>}
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1 hover:underline">
                        <Mail className="size-3.5" />
                        {profile.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {profile.bio && <p className="mt-4 text-sm text-ink">{profile.bio}</p>}
              {profile.stats.total > 0 && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-verified-bg px-3 py-1 text-xs font-medium text-verified-text">
                  <ShieldCheck className="size-3.5" />
                  {profile.stats.verified} of {profile.stats.total} items verified
                </p>
              )}
            </section>

            <section className="rounded-xl border border-line bg-white p-4 text-sm">
              <p className="mb-2 font-medium text-ink">What the labels mean</p>
              <ul className="space-y-2 text-ink-muted">
                <li className="flex items-center gap-2"><Badge status="verified" /> Confirmed by the institution</li>
                <li className="flex items-center gap-2"><Badge status="team-confirmed" /> Confirmed by teammates</li>
                <li className="flex items-center gap-2"><Badge status="self-reported" /> Added by {firstName}</li>
              </ul>
            </section>

            <Section title="Projects" items={profile.projects} />
            <Section title="Certifications" items={profile.certifications} />
            <Section title="Achievements" items={profile.achievements} />

            {profile.skills.length > 0 && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-ink">Skills</h2>
                <ul className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <li
                      key={s.name}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                        s.verified ? 'bg-verified-bg text-verified-text' : 'bg-sand text-ink'
                      }`}
                    >
                      {s.verified && <Check className="size-3" />}
                      {s.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}