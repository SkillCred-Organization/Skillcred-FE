import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock3, ExternalLink, FileText, Inbox, Pencil, Search, ShieldCheck } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { useAuth } from '../auth/authContext'
import { adminApi, reviewDate, safeEvidenceUrl, type AdminClaim, type ReviewStatus } from '../../lib/admin'
import { ApiError } from '../../lib/apiClient'
import { trackEvent } from '../../lib/analytics'
import { useResource } from '../../hooks/useResource'
import { useInstitution } from './adminContext'
import { ClaimRow, EmptyPanel, ErrorNotice, PageHeading, Pagination, Panel, PersonAvatar, ResourceState, StatusPill } from './AdminUI'

export function AdminDashboard() {
  const { user } = useAuth()
  const { institution } = useInstitution()
  const load = useCallback(async (signal: AbortSignal) => {
    const [dashboard, queue] = await Promise.all([adminApi.dashboard(signal), adminApi.queue({ limit: 3, sort: 'oldest' }, signal)])
    return { dashboard, queue }
  }, [])
  const resource = useResource(load)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const data = resource.data
  return <><PageHeading title={`${greeting}, ${user?.fullName.trim().split(/\s+/)[0] || 'there'}`} description={`Claims from ${institution.name} learners waiting for you.`} action={<Link className="workspace-button" to="/admin/queue"><Inbox size={18} />Open review queue</Link>} /><ResourceState {...resource} retry={resource.reload} />{data && <><div className="admin-stats">{[
    { value: data.dashboard.pendingClaims, title: 'To review', note: 'Waiting for your review', icon: Inbox, color: 'peach' },
    { value: data.dashboard.overdueClaims, title: 'Waiting over 7 days', note: data.queue.claims[0]?.waitingDays ? `Oldest: ${data.queue.claims[0].waitingDays} days` : 'Review oldest claims first', icon: Clock3, color: 'blue' },
    { value: data.dashboard.verified, title: 'Verified', note: 'Total verified claims', icon: ShieldCheck, color: 'green' },
    { value: data.dashboard.needsChanges, title: 'Changes asked', note: 'Waiting on learners', icon: Pencil, color: 'purple' },
  ].map(({ value, title, note, icon: Icon, color }) => <Panel key={title} className="admin-stat"><span className={`stat-icon ${color}`}><Icon size={22} /></span><strong>{value}</strong><h2>{title}</h2><p>{note}</p></Panel>)}</div><div className="admin-dashboard-columns"><Panel><div className="panel-heading"><h2>Waiting longest</h2><Link to="/admin/queue">See all<ChevronRight size={18} /></Link></div><div className="claim-list">{data.queue.claims.length ? data.queue.claims.map(claim => <ClaimRow key={claim.id} claim={claim} />) : <EmptyPanel title="You’re all caught up">New claims from your learners will appear here.</EmptyPanel>}</div></Panel><Panel><h2>Recent decisions</h2>{data.dashboard.recentDecisions.length ? data.dashboard.recentDecisions.map(decision => <Link to={`/admin/claims/${encodeURIComponent(decision.claimId)}`} key={decision.claimId} className="decision-row"><div><StatusPill status={decision.outcome} /><time>{reviewDate(decision.decidedAt)}</time></div><p>{decision.title || decision.type} · {decision.learnerName || 'Learner'}</p></Link>) : <EmptyPanel title="No decisions yet">Your recent reviews will appear here.</EmptyPanel>}</Panel></div></>}</>
}

export function ReviewQueue() {
  const [params, setParams] = useSearchParams()
  const status: ReviewStatus = params.get('status') === 'verified' ? 'verified' : params.get('status') === 'needs-changes' ? 'needs-changes' : 'pending'
  const query = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const load = useCallback((signal: AbortSignal) => adminApi.queue({ status, q: query, page, limit: 10, sort: 'oldest' }, signal), [status, query, page])
  const resource = useResource(load)
  function filter(values: Record<string, string>) { setParams({ status, ...(query ? { q: query } : {}), ...values }, { replace: true }) }
  return <><PageHeading title="Review queue" description="Check learner claims and help their work stand out." /><div className="queue-tools"><div className="workspace-filters" aria-label="Claim status">{([{ key: 'pending', label: 'To review' }, { key: 'verified', label: 'Verified' }, { key: 'needs-changes', label: 'Changes asked' }] as const).map(tab => <button key={tab.key} aria-pressed={status === tab.key} onClick={() => filter({ status: tab.key, page: '1' })}>{tab.label}{resource.data && <span>{resource.data.counts[tab.key]}</span>}</button>)}</div><label className="workspace-search"><Search size={20} /><input type="search" aria-label="Search by learner name" placeholder="Search learner name" value={query} onChange={event => filter({ q: event.target.value, page: '1' })} /></label></div><ResourceState {...resource} retry={resource.reload} />{resource.data && <>{status === 'pending' && resource.data.claims.some(claim => claim.overdue) && <p className="queue-notice"><Clock3 size={18} />Some claims have been waiting over 7 days. Review the oldest first.</p>}<div className="claim-list queue-list">{resource.data.claims.length ? resource.data.claims.map(claim => <ClaimRow key={claim.id} claim={claim} />) : <Panel><EmptyPanel title={query ? 'No matching claims' : status === 'pending' ? 'You’re all caught up' : 'No claims here yet'}>{query ? 'Try another learner’s name or clear your search.' : 'Claims will appear here when their status changes.'}</EmptyPanel></Panel>}</div><Pagination page={resource.data.page} pages={resource.data.totalPages} onPage={page => filter({ page: String(page) })} /></>}</>
}

function Evidence({ claim }: { claim: AdminClaim }) {
  const items = [...claim.evidence]
  if (claim.proofLink && !items.some(item => item.url === claim.proofLink)) items.unshift({ id: 'proof', label: 'Proof link', url: claim.proofLink })
  return <><h3>Proof</h3>{items.length ? <div className="proof-list">{items.map(item => {
    const url = safeEvidenceUrl(item.url)
    return <div className="proof-item" key={item.id}><FileText size={22} /><div><strong>{item.label || 'Evidence link'}</strong><p>{url ? new URL(url).hostname : 'This link cannot be opened safely.'}</p></div>{url && <a href={url} target="_blank" rel="noopener noreferrer">Open<ExternalLink size={16} /><span className="sr-only"> {item.label} in a new tab</span></a>}</div>
  })}</div> : <p className="workspace-note">No proof was attached to this claim.</p>}</>
}

function ClaimContent({ initial, reload }: { initial: AdminClaim; reload: () => void }) {
  const [claim, setClaim] = useState(initial)
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  useEffect(() => { trackEvent('claim_review_opened', { claim_type: initial.type }) }, [initial.id, initial.type])
  async function decide(outcome: 'verify' | 'changes') {
    if (busy || claim.status !== 'pending') return
    setBusy(true); setError('')
    try {
      const response = outcome === 'verify' ? await adminApi.verify(claim.id) : await adminApi.requestChanges(claim.id, reason, message)
      setClaim(response.claim); setAsking(false)
      trackEvent(outcome === 'verify' ? 'claim_verified' : 'claim_changes_requested', { claim_type: claim.type })
      toast.success(outcome === 'verify' ? 'Claim verified. The learner will be notified.' : 'Changes requested. The learner will be notified.')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'CLAIM_NOT_PENDING') { toast.error('This claim was already reviewed. Showing its latest status.'); reload() }
      else setError(e instanceof Error ? e.message : 'Unable to save your decision. Please try again.')
    } finally { setBusy(false) }
  }
  const dateRange = [reviewDate(claim.startDate), reviewDate(claim.endDate)].filter(Boolean).join(' – ')
  return <div className="claim-review-columns"><div className="workspace-stack"><Panel className="claim-learner"><PersonAvatar name={claim.learner?.fullName} large /><div><h2>{claim.learner?.fullName || 'Learner'}</h2><p>{[claim.programme || claim.track?.replaceAll('_', ' '), claim.cohort].filter(Boolean).join(' · ') || claim.learner?.email}</p></div></Panel><Panel className="claim-detail"><p className="workspace-eyebrow">{claim.type}{claim.teammates.length ? ' · Team' : ''}</p><div className="claim-title"><h1>{claim.title || claim.programme || 'Learner claim'}</h1><StatusPill status={claim.status} /></div><p className="claim-summary">{[claim.summary || claim.description, claim.role ? `Role: ${claim.role}` : '', dateRange].filter(Boolean).join(' · ')}</p><Evidence claim={claim} />{claim.teammates.length > 0 && <><h3>Teammates</h3><p>{claim.teammates.map(person => person.name || person.email || 'Teammate').join(' · ')}</p><p className="workspace-note">Teammate confirmations are not available yet. These names were provided by the learner.</p></>}{claim.decision?.messageToLearner && <div className="decision-message"><h3>{claim.decision.reason || 'Review feedback'}</h3><p>{claim.decision.messageToLearner}</p></div>}</Panel></div><Panel className="claim-decision"><h2>{asking ? 'Ask for changes' : 'Your decision'}</h2><ErrorNotice message={error} />{claim.status !== 'pending' ? <><StatusPill status={claim.status} /><p>This claim has been reviewed{claim.decision?.at ? ` on ${reviewDate(claim.decision.at)}` : ''}.</p><Link className="workspace-button" to="/admin/queue">Back to review queue</Link></> : asking ? <form className="workspace-form" onSubmit={event => { event.preventDefault(); void decide('changes') }}><label>Reason<select required value={reason} onChange={event => setReason(event.target.value)} disabled={busy}><option value="">Choose a reason</option><option>Missing or unclear proof</option><option>Incorrect dates</option><option>Role or contribution unclear</option><option>Programme details do not match</option><option>Other changes needed</option></select></label><label>Message to learner<textarea placeholder="Explain what needs to change…" minLength={3} maxLength={2000} required value={message} onChange={event => setMessage(event.target.value)} disabled={busy} /></label><p className="workspace-note">Be specific so the learner knows what to update. They’ll receive your feedback by email.</p><Button type="submit" loading={busy} disabled={message.trim().length < 3 || !reason}>{busy ? 'Sending…' : 'Send request'}</Button><Button variant="outline" disabled={busy} onClick={() => setAsking(false)}>Cancel</Button></form> : <><p>Does this match what {claim.learner?.fullName?.split(' ')[0] || 'this learner'} did in your programme?</p><Button variant="accent" icon={<ShieldCheck size={18} />} loading={busy} onClick={() => void decide('verify')}>{busy ? 'Submitting…' : 'Verify'}</Button><Button variant="outline" disabled={busy} onClick={() => setAsking(true)}>Ask for changes</Button><p className="workspace-note">Verified items show your institution’s name on the learner’s public profile.</p></>}</Panel></div>
}

export function ClaimReview() {
  const { claimId = '' } = useParams()
  const load = useCallback((signal: AbortSignal) => adminApi.claim(claimId, signal), [claimId])
  const resource = useResource(load)
  return <><Link className="workspace-back review-back" to="/admin/queue"><ChevronLeft size={18} />Review queue</Link><ResourceState {...resource} retry={resource.reload} />{resource.data && <ClaimContent key={resource.data.claim.id + (resource.data.claim.decision?.at || '')} initial={resource.data.claim} reload={resource.reload} />}</>
}
