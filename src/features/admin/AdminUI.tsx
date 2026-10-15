import type { ReactNode } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock3, Inbox, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { initials, waitingLabel, type AdminClaim, type ReviewStatus } from '../../lib/admin'

export function PageHeading({ title, description, action, back }: { title: string; description?: string; action?: ReactNode; back?: string }) {
  return <header className="workspace-heading"><div>{back && <Link className="workspace-back" to={back}><ArrowLeft size={20} />Back</Link>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>
}
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`workspace-panel ${className}`}>{children}</section> }
export function PersonAvatar({ name, large = false }: { name?: string | null; large?: boolean }) { return <span className={`person-avatar ${large ? 'person-avatar-large' : ''}`} aria-hidden="true">{initials(name)}</span> }
export function StatusPill({ status }: { status: ReviewStatus }) {
  const Icon = status === 'pending' ? Clock3 : status === 'verified' ? ShieldCheck : TriangleAlert
  return <span className={`review-status status-${status}`}><Icon size={13} aria-hidden="true" />{status === 'pending' ? 'Pending' : status === 'verified' ? 'Verified' : 'Needs changes'}</span>
}
export function ResourceState({ loading, error, retry }: { loading: boolean; error?: Error; retry: () => void }) {
  if (loading) return <div className="workspace-skeleton" role="status" aria-label="Loading"><div /><div /><div /><span className="sr-only">Loading…</span></div>
  if (error) return <Panel><div className="workspace-empty" role="alert"><TriangleAlert size={32} /><h2>We couldn’t load this page</h2><p>{error.message}</p><Button onClick={retry}>Try again</Button></div></Panel>
  return null
}
export function EmptyPanel({ title, children }: { title: string; children: ReactNode }) { return <div className="workspace-empty"><span className="empty-icon"><Inbox size={28} /></span><h2>{title}</h2><p>{children}</p></div> }
export function ErrorNotice({ message }: { message: string }) { return message ? <div className="workspace-error" role="alert"><TriangleAlert size={18} /><span>{message}</span></div> : null }
export function Unavailable({ children }: { children: ReactNode }) { return <p className="workspace-note">{children}</p> }
export function ClaimRow({ claim }: { claim: AdminClaim }) {
  return <Link to={`/admin/claims/${encodeURIComponent(claim.id)}`} className="claim-row"><PersonAvatar name={claim.learner?.fullName} /><div className="claim-row-copy"><strong>{claim.learner?.fullName || 'Learner'}</strong><p>{claim.type.charAt(0).toUpperCase() + claim.type.slice(1)} · {claim.title || claim.programme || 'Untitled claim'}{claim.status === 'pending' && claim.waitingDays !== null ? ` · ${waitingLabel(claim.waitingDays)}` : ''}</p></div><StatusPill status={claim.status} /><ChevronRight className="row-chevron" size={20} /></Link>
}
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  return pages > 1 ? <nav className="workspace-pagination" aria-label="Pagination"><Button variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft size={16} />}>Previous</Button><span>Page {page} of {pages}</span><Button variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next<ChevronRight size={16} /></Button></nav> : null
}
