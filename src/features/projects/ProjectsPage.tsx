import { useEffect, useState } from 'react'
import { Folder, Plus, TriangleAlert } from 'lucide-react'
import Button from '../../components/ui/Button'
import ChoiceChip from '../../components/ui/ChoiceChip'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/toastContext'
import { getProjects, requestVerification } from '../../lib/api'
import { errorText } from '../../lib/errors'
import type { Project, Status } from '../../types'
import AddProjectModal from './AddProjectModal'
import ProjectRow from './ProjectRow'
import { announceProjectAdded } from './projectToast'

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

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError(true))
  }, [attempt])

  async function handleRequestVerification(id: string) {
    setRequestingId(id)
    try {
      const updated = await requestVerification(id)
      setProjects((list) => (list ?? []).map((p) => (p.id === id ? updated : p)))
      toast.success('Sent to your institution for verification.')
    } catch (err) {
      toast.error(errorText(err, "Couldn't send this project. Please try again."))
    } finally {
      setRequestingId(null)
    }
  }

  const addButton = (
    <Button icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
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
        </div>
        {addButton}
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

      {adding && (
        <AddProjectModal
          onClose={() => setAdding(false)}
          onCreated={(project) => {
            setProjects((list) => [project, ...(list ?? [])])
            announceProjectAdded(toast, project)
          }}
        />
      )}
    </div>
  )
}