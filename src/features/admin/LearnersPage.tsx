import { useCallback, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi, learnerClaims, type AdminLearner } from '../../lib/admin'
import { useResource } from '../../hooks/useResource'
import { EmptyPanel, PageHeading, Panel, PersonAvatar, ResourceState, StatusPill } from './AdminUI'

function LearnerDetails({ learner }: { learner: AdminLearner }) {
  const load = useCallback((signal: AbortSignal) => learnerClaims(learner, signal), [learner])
  const resource = useResource(load)
  return <Panel className="learner-detail"><div className="learner-header"><PersonAvatar name={learner.fullName} large /><div><h2>{learner.fullName}</h2><p>{learner.email}</p><p>{[learner.programme, learner.cohort].filter(Boolean).join(' · ')}</p></div></div><h3>Claims</h3><ResourceState {...resource} retry={resource.reload} />{resource.data && (resource.data.length ? <div>{resource.data.map(claim => <Link key={claim.id} className="learner-claim" to={`/admin/claims/${encodeURIComponent(claim.id)}`}><div><strong>{claim.title || claim.programme || claim.type}</strong><p>{claim.type}</p></div><StatusPill status={claim.status} /><ChevronRight size={18} /></Link>)}</div> : <EmptyPanel title="No claims yet">This learner hasn’t sent your institution any claims.</EmptyPanel>)}</Panel>
}

export default function LearnersPage() {
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  // Fetch every page before applying the pending filter, so it includes all learners.
  const load = useCallback(async (signal: AbortSignal) => {
    const learners: AdminLearner[] = []
    let page = 1
    let pages: number
    do { const result = await adminApi.learners({ q: query, page, limit: 100 }, signal); learners.push(...result.learners); pages = result.totalPages; page++ } while (page <= pages)
    return learners
  }, [query])
  const resource = useResource(load)
  const filtered = resource.data?.filter(learner => !pending || learner.claims.pending > 0) || []
  const visible = filtered.slice((page - 1) * 20, page * 20)
  const selected = filtered.find(learner => learner.id === selectedId) || visible[0]
  return <><PageHeading title="Learners" description="People linked to your institution and their claims." /><div className="queue-tools"><div className="workspace-filters"><button aria-pressed={!pending} onClick={() => { setPending(false); setPage(1) }}>All learners</button><button aria-pressed={pending} onClick={() => { setPending(true); setPage(1) }}>With pending claims</button></div><label className="workspace-search"><Search size={20} /><input type="search" aria-label="Search learners" placeholder="Search learners" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></label></div><ResourceState {...resource} retry={resource.reload} />{resource.data && (filtered.length ? <><div className="learners-columns"><Panel className="learner-list">{visible.map(learner => <button key={learner.id} className={`learner-select ${selected?.id === learner.id ? 'selected' : ''}`} aria-pressed={selected?.id === learner.id} onClick={() => setSelectedId(learner.id)}><PersonAvatar name={learner.fullName} /><div><strong>{learner.fullName || 'Learner'}</strong><p>{[learner.programme, learner.cohort].filter(Boolean).join(' · ') || learner.email}</p><small>{learner.claims.verified} verified · {learner.claims.pending} pending</small></div><ChevronRight size={18} /></button>)}</Panel>{selected && <LearnerDetails key={selected.id} learner={selected} />}</div>{filtered.length > 20 && <div className="workspace-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {Math.ceil(filtered.length / 20)}</span><button disabled={page * 20 >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></div>}</> : <Panel><EmptyPanel title="No learners found">{query || pending ? 'Try clearing your search or changing the filter.' : 'Learners will appear here when they link your institution to their profile.'}</EmptyPanel></Panel>)}</>
}
