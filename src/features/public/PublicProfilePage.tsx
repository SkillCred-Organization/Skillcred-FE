import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, Code, Mail, MapPin, ShieldCheck, Star, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

function caption(item: PublicItem, firstName: string) {
  if (item.verifiedBy) return `Verified by ${item.verifiedBy}`
  if (item.status === 'verified') return 'Verified by the institution'
  if (item.status === 'team-confirmed') return 'Confirmed by teammates'
  if (item.status === 'self-reported') return `Added by ${firstName}`
  return ''
}

function Tile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cream text-ink-muted">
      <Icon className="size-4" />
    </span>
  )
}

type SectionProps = { title: string; icon: LucideIcon; items: PublicItem[]; firstName: string }

function Section({ title, icon, items, firstName }: SectionProps) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <Tile icon={icon} />
            <div className="min-w-0 flex-1 basis-40">
              <p className="font-medium text-ink">{item.title}</p>
              {item.summary && <p className="text-sm text-ink-muted">{item.summary}</p>}
              <p className="text-xs text-ink-muted">{caption(item, firstName)}</p>
            </div>
            <Badge status={item.status} />
          </li>
        ))}
      </ul>
    </section>
  )
}

type SkillRowProps = { names: string[]; note: string; status: 'verified' | 'self-reported' }

function SkillRow({ names, note, status }: SkillRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <Tile icon={Star} />
      <div className="min-w-0 flex-1 basis-40">
        <p className="font-medium text-ink">{names.join(' · ')}</p>
        <p className="text-xs text-ink-muted">{note}</p>
      </div>
      <Badge status={status} />
    </li>
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
  const verifiedSkills = profile?.skills.filter((s) => s.verified) ?? []
  const otherSkills = profile?.skills.filter((s) => !s.verified) ?? []

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/">
            <img src="/logo.svg" alt="SkillCred" className="h-6" />
          </Link>
          <Link to="/user-type" className="text-sm font-medium text-brand underline underline-offset-2">
            Create your own
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
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
              <p className="mb-3 font-medium text-ink">What the labels mean</p>
              <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
                <li className="flex items-center gap-2">
                  <Badge status="verified" />
                  <span className="text-ink-muted">by the institution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge status="team-confirmed" />
                  <span className="text-ink-muted">by teammates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge status="self-reported" />
                  <span className="text-ink-muted">by {firstName}</span>
                </li>
              </ul>
            </section>

            <Section title="Projects" icon={Code} items={profile.projects} firstName={firstName} />
            <Section title="Certifications" icon={Award} items={profile.certifications} firstName={firstName} />
            <Section title="Achievements" icon={Star} items={profile.achievements} firstName={firstName} />

            {profile.skills.length > 0 && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-ink">Skills</h2>
                <ul className="divide-y divide-line rounded-xl border border-line bg-white">
                  {verifiedSkills.length > 0 && (
                    <SkillRow names={verifiedSkills.map((s) => s.name)} note="Verified through programme" status="verified" />
                  )}
                  {otherSkills.length > 0 && (
                    <SkillRow names={otherSkills.map((s) => s.name)} note={`Added by ${firstName}`} status="self-reported" />
                  )}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}