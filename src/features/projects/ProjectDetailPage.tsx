import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ExternalLink, Folder, TriangleAlert } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import InlineAlert from '../../components/ui/InlineAlert'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/toastContext'
import { getProject, requestVerification, withdrawRequest } from '../../lib/api'
import { ApiError } from '../../lib/apiClient'
import { errorText } from '../../lib/errors'
import { formatMonth } from '../../lib/format'
import { projectTracks } from '../../lib/options'
import type { ProjectDetail } from '../../types'
import ProjectManageActions from './ProjectManageActions'
import { detailFields } from '../../lib/projectFields'


function Timeline({ status }: { status: ProjectDetail['status'] }) {
  const sent = ['pending', 'needs-changes', 'verified', 'team-confirmed'].includes(status)
  if (!sent) return <p className="text-sm text-ink-muted">Not sent for verification yet.</p>
  const steps = [
    { label: 'Submitted', done: true },
    { label: 'Reviewed by your institution', done: status === 'verified' || status === 'needs-changes' },
    { label: 'Verified', done: status === 'verified' },
  ]
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-sm">
          <span className={`size-3 shrink-0 rounded-full ${s.done ? 'bg-accent' : 'border border-field-border bg-white'}`} />
          <span className={s.done ? 'text-ink' : 'text-ink-muted'}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-4 py-2 text-sm">
      <dt className="w-28 shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value}</dd>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id = '' } = useParams()
  const toast = useToast()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [busy, setBusy] = useState<'request' | 'withdraw' | null>(null)
  const [attempt, setAttempt] = useState(0)



  useEffect(() => {
    let cancelled = false
    getProject(id)
      .then((p) => {
        if (cancelled) return
        setProject(p)
        setState('ready')
      })
      .catch((err) => {
        if (!cancelled) setState(err instanceof ApiError && err.status === 404 ? 'missing' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  async function run(kind: 'request' | 'withdraw') {
    if (!project) return
    setBusy(kind)
    try {
      const updated = kind === 'request' ? await requestVerification(project.id) : await withdrawRequest(project.id)
      setProject((current) => (current ? { ...current, ...updated } : current))
      toast.success(
        kind === 'request'
          ? 'Sent to your institution for verification.'
          : 'Request withdrawn. The project is Self-reported again.',
      )
    } catch (err) {
      toast.error(errorText(err, 'Something went wrong. Please try again.'))
    } finally {
      setBusy(null)
    }
  }

  const back = (
    <Link to="/app/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
      <ChevronLeft className="size-4" />
      Projects
    </Link>
  )

  if (state === 'loading') {
    return (
      <div role="status" aria-label="Loading project" className="mx-auto max-w-4xl">
        {back}
        <Skeleton className="mb-3 h-8 w-1/2" />
        <Skeleton className="mb-6 h-4 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (state !== 'ready' || !project) {
    const missing = state === 'missing'
    return (
      <div className="mx-auto max-w-4xl">
        {back}
        <EmptyState
          icon={missing ? Folder : TriangleAlert}
          title={missing ? 'Project not found' : 'Something went wrong'}
          message={missing ? 'It may have been deleted.' : "It's on our side. Please try again in a moment."}

            action={
    missing ? undefined : (
      <Button
        variant="outline"
        onClick={() => {
          setState('loading')
          setAttempt((a) => a + 1)
        }}
      >
        Retry
      </Button>
    )
  }
        />
      </div>
    )
  }

  const trackLabel = projectTracks.find((t) => t.value === project.track)?.label ?? project.track
  const dates = [formatMonth(project.startDate), formatMonth(project.endDate)].filter(Boolean).join(' to ')
  const linkIsSafe = /^https?:\/\//i.test(project.proofLink)

  const extraDetails = (detailFields[project.track] ?? []).filter(
    (f) => f.key !== 'projectType' && f.key !== 'techStack' && project.details[f.key],
  )

  return (
    <div className="mx-auto max-w-4xl">
      {back}

      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">{project.title}</h1>
          <Badge status={project.status} />
        </div>
        <p className="mt-1 text-sm text-ink-muted">{project.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.actions.requestVerification && (
            <Button loading={busy === 'request'} disabled={busy === 'withdraw'} onClick={() => run('request')}>
              Request verification
            </Button>
          )}
          {project.actions.withdraw && (
            <Button variant="outline" loading={busy === 'withdraw'} disabled={busy === 'request'} onClick={() => run('withdraw')}>
              Withdraw request
            </Button>
          )}
            <ProjectManageActions project={project} onUpdated={setProject} />
        </div>
      </header>

      {project.status === 'needs-changes' && project.decision && (
        <InlineAlert
          variant="error"
          title={project.decision.reason || 'Your institution asked for changes'}
          className="mb-4"
        >
          {project.decision.message}
        </InlineAlert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="mb-1 text-base font-semibold text-ink">About this project</h2>
            <dl className="divide-y divide-line">
              <Row label="Your role" value={project.role} />
              <Row label="Track" value={trackLabel} />
              <Row label="Type" value={project.projectType} />
              <Row label="Dates" value={dates} />
            </dl>
          </section>

          {project.techStack.length > 0 && (
            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="mb-3 text-base font-semibold text-ink">Tech stack</h2>
              <ul className="flex flex-wrap gap-2">
                {project.techStack.map((t) => (
                  <li key={t} className="rounded-full bg-sand px-3 py-1 text-xs text-ink">{t}</li>
                ))}
              </ul>
            </section>
          )}

            {extraDetails.length > 0 && (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="mb-1 text-base font-semibold text-ink">More about this project</h2>
      <dl className="divide-y divide-line">
        {extraDetails.map((f) => (
          <Row key={f.key} label={f.label} value={project.details[f.key]} />
        ))}
      </dl>
    </section>
  )}

          {project.proofLink && (
            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="mb-3 text-base font-semibold text-ink">Proof</h2>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-ink">{project.proofLink}</span>
                {linkIsSafe && (
                  <a
                    href={project.proofLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 font-medium text-brand hover:underline"
                  >
                    Open <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </section>
          )}

          {project.teammates.length > 0 && (
            <section className="rounded-xl border border-line bg-white p-4">
              <h2 className="mb-3 text-base font-semibold text-ink">Teammates</h2>
              <ul className="divide-y divide-line">
                {project.teammates.map((t, i) => (
                  <li key={`${t.email}-${i}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{t.name}</span>
                      <span className="block truncate text-xs text-ink-muted">
                        {t.role ? `${t.role} · ` : ''}{t.email}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">Invite not sent yet</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">
                Teammates are saved, but invitation emails aren&apos;t sent yet.
              </p>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-line bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-ink">Verification</h2>
          <Timeline status={project.status} />
        </aside>
      </div>
    </div>
  )
}