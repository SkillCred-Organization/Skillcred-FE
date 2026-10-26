import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ChoiceChip from '../../components/ui/ChoiceChip'
import EmptyState from '../../components/ui/EmptyState'
import InlineAlert from '../../components/ui/InlineAlert'
import Skeleton from '../../components/ui/Skeleton'
import { getClaims, getProfile } from '../../lib/api'
import type { Claim } from '../../types'

type Filter = 'all' | 'needs-changes' | 'pending' | 'verified' | 'self-reported'

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs-changes', label: 'Needs changes' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'self-reported', label: 'Not requested' },
]

export default function VerificationOverviewPage() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState<Claim[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [institution, setInstitution] = useState('your institution')

  useEffect(() => {
    getClaims()
      .then(setClaims)
      .catch(() => setError(true))
  }, [attempt])

  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        if (profile?.institution?.name) setInstitution(profile.institution.name)
      })
      .catch(() => {})
  }, [])

  const countFor = (f: Filter) =>
    claims ? claims.filter((c) => f === 'all' || c.status === f).length : undefined
  const needs = claims?.filter((c) => c.status === 'needs-changes').length ?? 0
  const visible = claims?.filter((c) => filter === 'all' || c.status === filter) ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Verification</h1>
        <p className="text-sm text-ink-muted">
          Everything you&apos;ve asked {institution} to confirm, and where it stands.
        </p>
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
                setClaims(null)
                setAttempt((a) => a + 1)
              }}
            >
              Retry
            </Button>
          }
        />
      ) : claims === null ? (
        <div role="status" aria-label="Loading verification" className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-line bg-white p-4">
              <Skeleton className="mb-2 h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nothing to verify yet"
          message="Add a project and request verification. You can track every request here."
          action={<Button onClick={() => navigate('/app/projects')}>Go to projects</Button>}
        />
      ) : (
        <>
          {needs > 0 && (
            <InlineAlert
              variant="error"
              title={`${needs} ${needs === 1 ? 'item needs' : 'items need'} changes`}
              actionLabel="Show me"
              onAction={() => setFilter('needs-changes')}
              className="mb-4"
            >
              Fix {needs === 1 ? 'it' : 'them'} so nothing gets left behind.
            </InlineAlert>
          )}

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
            <p className="py-8 text-center text-sm text-ink-muted">Nothing with this status.</p>
          ) : (
            <ul className="space-y-3">
              {visible.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-white p-4"
                >
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="font-medium text-ink">{c.title}</p>
                    <p className="text-xs text-ink-muted">
                      {c.kind}
                      {c.updated ? ` · ${c.updated}` : ''}
                    </p>
                  </div>
                  <Badge status={c.status} />
                  {c.projectId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/projects/${c.projectId}${c.status === 'needs-changes' ? '?edit=1' : ''}`)}
                    >
                      {c.status === 'needs-changes' ? 'Fix' : 'View'}
                    </Button>
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