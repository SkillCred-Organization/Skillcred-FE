import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Bell,
  Folder,
  GraduationCap,
  Info,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  TriangleAlert,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import InlineAlert from '../../components/ui/InlineAlert'
import Skeleton from '../../components/ui/Skeleton'
import StatCard from '../../components/ui/StatCard'
import { useToast } from '../../components/ui/toastContext'
import { getDashboard, getProfile } from '../../lib/api'
import type { Activity, Dashboard, DashboardStat } from '../../types'
import { useAuth } from '../auth/authContext'
import AddProjectModal from '../projects/AddProjectModal'
import { announceProjectAdded } from '../projects/projectToast'
import ProfileLinkCard from './ProfileLinkCard'
import VerificationBanner from './VerificationBanner'

const activityStyle: Record<Activity['kind'], { icon: LucideIcon; style: string }> = {
  verified: { icon: ShieldCheck, style: 'bg-verified-bg text-verified-text' },
  confirmed: { icon: Users, style: 'bg-confirmed-bg text-confirmed-text' },
  'needs-changes': { icon: TriangleAlert, style: 'bg-changes-bg text-changes-text' },
  draft: { icon: Pencil, style: 'bg-self-bg text-self-text' },
  info: { icon: Info, style: 'bg-sand text-ink-muted' },
}

function statCardsFor(d: Dashboard) {
  const sub = (s: DashboardStat) => (s.total === 0 ? 'None yet' : `${s.verified} verified`)
  return [
    { icon: Folder, tone: 'apricot', label: 'Projects', value: d.stats.projects.total, sub: sub(d.stats.projects) },
    { icon: Award, tone: 'sage', label: 'Certifications', value: d.stats.certifications.total, sub: sub(d.stats.certifications) },
    { icon: Star, tone: 'plum', label: 'Skills', value: d.stats.skills.total, sub: sub(d.stats.skills) },
    { icon: GraduationCap, tone: 'info', label: 'Achievements', value: d.stats.achievements.total, sub: sub(d.stats.achievements) },
  ] as const
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard" className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function FirstTimeCard({ onAdd }: { onAdd: () => void }) {
  const steps = [
    'Add a project with a link. It is the fastest way to get verified.',
    'Ask your institution to verify it. It is one switch when you add it.',
    'Share your link. Send it with job applications.',
  ]
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Your profile is empty</h2>
      <p className="mt-1 text-sm text-ink-muted">Start with one project. It takes about 5 minutes.</p>
      <ol className="mt-4 space-y-3">
        {steps.map((text, i) => (
          <li key={text} className="flex items-start gap-3 text-sm text-ink">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-soft text-xs font-medium text-brand">
              {i + 1}
            </span>
            {text}
          </li>
        ))}
      </ol>
      <Button className="mt-4" icon={<Plus className="size-4" />} onClick={onAdd}>
        Add your first project
      </Button>
    </section>
  )
}

type ContentProps = { data: Dashboard; institution: string; onAdd: () => void }

function DashboardContent({ data, institution, onAdd }: ContentProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEmpty =
    data.stats.projects.total + data.stats.certifications.total + data.stats.achievements.total === 0
  const sent = data.banner.verified + data.banner.waiting + data.banner.needsChanges

  return (
    <>
      {isEmpty ? (
        <FirstTimeCard onAdd={onAdd} />
      ) : sent > 0 ? (
        <VerificationBanner
          institution={institution}
          verified={data.banner.verified}
          total={sent}
          waiting={data.banner.waiting}
          needsChanges={data.banner.needsChanges}
        />
      ) : (
        <InlineAlert
          variant="info"
          title="Nothing is waiting for verification"
          actionLabel="Open projects"
          onAction={() => navigate('/app/projects')}
        >
          Send a project to {institution} to start getting verified.
        </InlineAlert>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCardsFor(data).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border border-line bg-white p-4">
          <h2 className="mb-2 text-base font-semibold text-ink">Recent activity</h2>
          {data.activity.length === 0 ? (
            <p className="py-4 text-sm text-ink-muted">
              Nothing here yet. Your activity will show up as you add and verify items.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {data.activity.map((item) => {
                const { icon: Icon, style } = activityStyle[item.kind]
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${style}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{item.text}</p>
                      <p className="text-xs text-ink-muted">{item.time}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {user?.role === 'learner' && <ProfileLinkCard key={user.id} fullName={user.fullName} />}
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'there'
  const [adding, setAdding] = useState(false)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [institution, setInstitution] = useState('your institution')
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getDashboard()
      .then((d) => {
        if (!cancelled) setDashboard(d)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        if (profile?.institution?.name) setInstitution(profile.institution.name)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink sm:text-2xl">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-ink-muted">Here&apos;s where your profile stands.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink-muted hover:bg-cream"
          >
            <Bell className="size-4" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-error" />
          </button>
          <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add
          </Button>
        </div>
      </header>

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
                setDashboard(null)
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : dashboard === null ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent data={dashboard} institution={institution} onAdd={() => setAdding(true)} />
      )}

      {adding && (
        <AddProjectModal
          onClose={() => setAdding(false)}
          onCreated={(project) => {
            announceProjectAdded(toast, project)
            navigate('/app/projects')
          }}
        />
      )}
    </div>
  )
}