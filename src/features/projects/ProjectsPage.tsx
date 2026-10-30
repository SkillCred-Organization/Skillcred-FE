import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Folder, Plus, TriangleAlert, Star} from 'lucide-react'
import Button from '../../components/ui/Button'
import ChoiceChip from '../../components/ui/ChoiceChip'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/toastContext'
import { getProjects, requestVerification } from '../../lib/api'
import { atProjectLimit } from '../../lib/billing'
import { errorText, needsInstitution } from '../../lib/errors'
import type { Project, Status } from '../../types'
import AddProjectModal from './AddProjectModal'
import ProjectRow from './ProjectRow'
import { announceProjectAdded } from './projectToast'
import ChooseInstitutionModal from './ChooseInstitutionModal'
import LimitBanner from '../billing/LimitBanner'
import UpgradeModal from '../billing/UpgradeModal'
import { useBilling } from '../billing/useBilling'

type Filter = 'all' | Status

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'self-reported', label: 'Self-reported' },
  { value: 'draft', label: 'Draft' },
]

export default function ProjectsPage() {
  const toast = useToast()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [choosingFor, setChoosingFor] = useState<string | null>(null)
  const { billing, reload } = useBilling()
  const [upgrading, setUpgrading] = useState(false)
  const limitReached = atProjectLimit(billing)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  function openAdd() {
    if (limitReached) setUpgrading(true)
    else setAdding(true)
  }

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError(true))
  }, [attempt])

  async function sendRequest(id: string, institutionId?: string) {
    const updated = await requestVerification(id, institutionId)
    setProjects((list) => (list ?? []).map((p) => (p.id === id ? updated : p)))
    toast.success('Sent to your institution for verification.')
  }

  async function handleRequestVerification(id: string) {
    setRequestingId(id)
    try {
      await sendRequest(id)
    } catch (err) {
      if (needsInstitution(err)) setChoosingFor(id)
      else toast.error(errorText(err, "Couldn't send this project. Please try again."))
    } finally {
      setRequestingId(null)
    }
  }

  const addButton = (
    <Button icon={<Plus className="size-4" />} onClick={openAdd}>
      Add project
    </Button>
  )
  const countFor = (f: Filter) =>
    projects ? projects.filter((p) => f === 'all' || p.status === f).length : undefined
  const visible = projects?.filter((p) => filter === 'all' || p.status === filter) ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Projects</h1>
          <p className="text-sm text-ink-muted">Work you built, with proof. Verified projects carry the most weight.</p>
        
        {billing?.plan === 'premium' && (
  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pending-bg px-3 py-1 text-xs text-pending-text">
    <Star className="size-3" />
    Premium Plan
  </span>
)}
        </div>
        {addButton}
      </header>

     {billing && billing.projects.limit !== null &&
  (limitReached && !bannerDismissed ? (
    <LimitBanner billing={billing} onDismiss={() => setBannerDismissed(true)} />
  ) : (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-pending-text/20 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-ink">
            {billing.projects.used} of {billing.projects.limit} projects used
          </p>
          <span className="rounded-full bg-pending-bg px-2 py-0.5 text-xs text-pending-text">Free Plan</span>
        </div>
        <div className="mt-2 h-1.5 w-full max-w-[26rem] overflow-hidden rounded-full bg-pending-bg">
          <div
            className={`h-full rounded-full ${limitReached ? 'bg-pending-text' : 'bg-accent'}`}
            style={{ width: `${Math.min(100, (billing.projects.used / billing.projects.limit) * 100)}%` }}
          />
        </div>
      </div>
      <Link to="/app/billing" className="shrink-0 text-sm font-medium text-brand underline">
        {limitReached ? 'Get more with Premium' : 'See Premium'}
      </Link>
    </div>
  ))}

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
                setProjects(null)
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : projects === null ? (
        <div role="status" aria-label="Loading projects" className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
              <Skeleton className="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No projects yet"
          message="Add one with a link so your institution can verify it."
          action={addButton}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <ChoiceChip
                key={f.value}
                label={f.label}
                count={countFor(f.value)}
                selected={filter === f.value}
                onClick={() => setFilter(f.value)}
              />
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">No projects with this status.</p>
          ) : (
            <ul className="space-y-3">
              {visible.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onRequestVerification={handleRequestVerification}
                  busy={requestingId === p.id}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {choosingFor && (
        <ChooseInstitutionModal
          onClose={() => setChoosingFor(null)}
          onSend={(institutionId) => sendRequest(choosingFor, institutionId)}
        />
      )}

      {adding && (
        <AddProjectModal
          onClose={() => setAdding(false)}
          onCreated={(project) => {
            setProjects((list) => [project, ...(list ?? [])])
            announceProjectAdded(toast, project)
            reload()
          }}
          onLimitReached={() => {
            setUpgrading(true)
            reload()
          }}
        />
      )}

      {upgrading && <UpgradeModal billing={billing} onClose={() => setUpgrading(false)} />}
    </div>
  )
}