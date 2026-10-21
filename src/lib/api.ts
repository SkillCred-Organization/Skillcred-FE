import { apiClient } from './apiClient'
import { timeAgo } from './format'
import type { Institution, LearnerProfile, NewProject, OnboardingData, Project, Status, ProjectDetail, Activity, Dashboard, DashboardStat} from '../types'
import type { Claim } from '../types'


// ---------- Profile and onboarding ----------

type InstitutionsResponse = { institutions: { _id: string; name: string }[] }

export async function searchInstitutions(query: string): Promise<Institution[]> {
  const data = await apiClient<InstitutionsResponse>(
    `/api/learner/institutions?q=${encodeURIComponent(query.trim())}`,
  )
  return data.institutions.map((i) => ({ id: i._id, name: i.name })) // _id becomes id here, so pages never see _id
}

// The only keys PATCH /api/learner/profile accepts. Any extra key returns a 400.
type ProfilePayload = {
  headline?: string
  location?: string
  skills?: string[]
  institution?: { name: string; institutionId?: string; programme?: string; cohort?: string }
}

export function buildProfilePayload(data: OnboardingData): ProfilePayload {
  const payload: ProfilePayload = {}
  if (data.headline.trim()) payload.headline = data.headline.trim()
  if (data.location.trim()) payload.location = data.location.trim()
  if (data.skills.length) payload.skills = data.skills

  if (data.institution?.name) {
    const institution: NonNullable<ProfilePayload['institution']> = { name: data.institution.name }
    if (data.institution.id) institution.institutionId = data.institution.id
    if (data.programme) institution.programme = data.programme
    if (data.year) institution.cohort = data.year // ASSUMPTION: year goes into cohort
    payload.institution = institution
  }
  return payload
}

export async function saveOnboarding(data: OnboardingData): Promise<void> {
  const payload = buildProfilePayload(data)
  if (Object.keys(payload).length === 0) return // the learner skipped everything, so there's nothing to send
  await apiClient('/api/learner/profile', { method: 'PATCH', body: JSON.stringify(payload) })
}

// GET /api/learner/profile gives { profile: {...} }, or { profile: null } for a learner with no profile yet
export function getProfile() {
  return apiClient<{ profile: LearnerProfile | null }>('/api/learner/profile')
}

// ---------- Projects ----------

  type ApiProject = {
    id?: string
    _id?: string
    title: string
    summary?: string
    status: string
    role?: string
    track?: string
    startDate?: string
    endDate?: string
    proofLink?: string
    details?: { projectType?: string; techStack?: string[] }
    teammates?: { name?: string; email?: string; role?: string }[]
    decision?: { reason?: string; messageToLearner?: string }
    actions?: { edit?: boolean; requestVerification?: boolean; withdraw?: boolean; delete?: boolean }
    createdAt?: string
    updatedAt?: string
  }

const knownStatuses: Status[] = ['verified', 'team-confirmed', 'pending', 'needs-changes', 'self-reported', 'draft']

// One short line under each project, built from what the backend sends
function projectMeta(p: ApiProject, status: Status) {
  const when = timeAgo(p.updatedAt ?? p.createdAt)
  const suffix = when ? ` · ${when}` : ''
  switch (status) {
    case 'verified':
      return `Verified${suffix}`
    case 'pending':
      return `Sent for verification${suffix}`
    case 'needs-changes':
      return `Changes requested${suffix}`
    case 'team-confirmed':
      return `Confirmed by teammates${suffix}`
    case 'draft':
      return 'Draft · only you can see it'
    default:
      return p.teammates?.length ? 'Team project' : 'Personal project'
  }
}

// This is the only place that knows the backend's shape. If a field name differs, fix it here.
function toProject(p: ApiProject): Project {
  const status = knownStatuses.includes(p.status as Status) ? (p.status as Status) : 'self-reported'
  return {
    id: String(p.id ?? p._id ?? ''),
    title: p.title,
    summary: p.summary ?? '',
    status,
    meta: projectMeta(p, status),
    actions: {
      edit: p.actions?.edit ?? false,
      requestVerification: p.actions?.requestVerification ?? false,
      withdraw: p.actions?.withdraw ?? false,
      delete: p.actions?.delete ?? false,
    },
  }
}

// Empty values are left out: the backend rejects unknown fields and invalid empty ones.
function clean(object: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== '' && value !== undefined))
}

function buildProjectFields(input: Omit<NewProject, 'status'>, isDraft = false) {
  return clean({
    title: input.title.trim() || (isDraft ? 'Untitled project' : ''),
    summary: input.summary.trim(),
    role: input.role.trim(),
    track: input.track,
    startDate: input.startDate,
    endDate: input.endDate,
    proofLink: input.link.trim(),
    teammates: input.teammates.length
      ? input.teammates.map((t) => clean({ email: t.email, name: t.name, role: t.role }))
      : undefined,
  })
}

export function buildProjectPayload(input: NewProject) {
  const isDraft = input.status === 'draft'
  return {
    ...buildProjectFields(input, isDraft),
    draft: isDraft,
    requestVerification: input.status === 'pending',
  }
}

export async function getProjects(): Promise<Project[]> {
  const data = await apiClient<{ items: ApiProject[] }>('/api/learner/projects')
  return data.items.map(toProject)
}

export async function addProject(input: NewProject): Promise<Project> {
  const data = await apiClient<{ item: ApiProject }>('/api/learner/projects', {
    method: 'POST',
    body: JSON.stringify(buildProjectPayload(input)),
  })
  return toProject(data.item)
}

export async function requestVerification(id: string): Promise<Project> {
  const data = await apiClient<{ item: ApiProject }>(`/api/learner/projects/${id}/request-verification`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return toProject(data.item)
}

  function toProjectDetail(p: ApiProject): ProjectDetail {
    const hasDecision = p.decision?.reason || p.decision?.messageToLearner
    return {
      ...toProject(p),
      role: p.role ?? '',
      track: p.track ?? '',
      projectType: p.details?.projectType ?? '',
      startDate: p.startDate ?? '',
      endDate: p.endDate ?? '',
      proofLink: p.proofLink ?? '',
      techStack: p.details?.techStack ?? [],
      teammates: (p.teammates ?? []).map((t) => ({ name: t.name ?? '', email: t.email ?? '', role: t.role ?? '' })),
      decision: hasDecision
        ? { reason: p.decision?.reason ?? '', message: p.decision?.messageToLearner ?? '' }
        : undefined,
    }
  }

  export async function getProject(id: string): Promise<ProjectDetail> {
    const data = await apiClient<{ item: ApiProject }>(`/api/learner/projects/${id}`)
    return toProjectDetail(data.item)
  }

  export async function withdrawRequest(id: string): Promise<Project> {
    const data = await apiClient<{ item: ApiProject }>(`/api/learner/projects/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    return toProject(data.item)
  }


  // ---------- Dashboard ----------

type ApiStat = { total?: number; verified?: number }
type ApiActivity = {
  id?: string
  _id?: string
  type?: string
  kind?: string
  event?: string
  message?: string
  text?: string
  title?: string
  description?: string
  createdAt?: string
  at?: string
  date?: string
}
type ApiDashboard = {
  stats?: { projects?: ApiStat; certifications?: ApiStat; skills?: ApiStat; achievements?: ApiStat }
  banner?: { verified?: number; waiting?: number; needsChanges?: number }
  recentActivity?: ApiActivity[]
}

function toStat(s?: ApiStat): DashboardStat {
  return { total: s?.total ?? 0, verified: s?.verified ?? 0 }
}

// Picks an icon for an activity from its type name. Unknown types get a neutral icon.
function activityKind(a: ApiActivity): Activity['kind'] {
  const label = `${a.type ?? ''} ${a.kind ?? ''} ${a.event ?? ''}`.toLowerCase().replace(/[_-]/g, ' ')
  if (/verified|approved/.test(label)) return 'verified'
  if (/changes/.test(label)) return 'needs-changes'
  if (/confirm/.test(label)) return 'confirmed'
  if (/draft/.test(label)) return 'draft'
  return 'info'
}

// The only place that knows the dashboard's backend shape. A wrong field name is fixed here.
export async function getDashboard(): Promise<Dashboard> {
  const data = await apiClient<ApiDashboard>('/api/learner/dashboard')
  return {
    stats: {
      projects: toStat(data.stats?.projects),
      certifications: toStat(data.stats?.certifications),
      skills: toStat(data.stats?.skills),
      achievements: toStat(data.stats?.achievements),
    },
    banner: {
      verified: data.banner?.verified ?? 0,
      waiting: data.banner?.waiting ?? 0,
      needsChanges: data.banner?.needsChanges ?? 0,
    },
    activity: (data.recentActivity ?? []).map((a, i) => ({
      id: String(a.id ?? a._id ?? i),
      kind: activityKind(a),
      text: a.message ?? a.text ?? a.title ?? a.description ?? 'Activity on your profile',
      time: timeAgo(a.createdAt ?? a.at ?? a.date),
    })),
  }
}

export async function updateProject(id: string, input: Omit<NewProject, 'status'>): Promise<Project> {
  const data = await apiClient<{ item: ApiProject }>(`/api/learner/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(buildProjectFields(input)),
  })
  return toProject(data.item)
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient(`/api/learner/projects/${id}`, { method: 'DELETE' })
}

// ---------- Verification (all my claims) ----------

type ApiClaim = {
  id?: string
  _id?: string
  title?: string
  name?: string
  type?: string
  kind?: string
  itemType?: string
  status?: string
  projectId?: string
  itemId?: string
  refId?: string
  project?: { id?: string; _id?: string; title?: string }
  updatedAt?: string
  createdAt?: string
}

// The only place that knows the claims' backend shape. A wrong field name is fixed here.
export async function getClaims(): Promise<Claim[]> {
  const data = await apiClient<{ items?: ApiClaim[] }>('/api/learner/claims')
  return (data.items ?? []).map((c, i) => {
    const type = (c.type ?? c.kind ?? c.itemType ?? '').toLowerCase()
    const isProject = type.includes('project')
    const status = knownStatuses.includes(c.status as Status) ? (c.status as Status) : 'self-reported'
    const linkId = c.projectId ?? c.itemId ?? c.refId ?? c.project?.id ?? c.project?._id ?? c.id ?? c._id
    return {
      id: String(c.id ?? c._id ?? i),
      title: c.title ?? c.name ?? c.project?.title ?? 'Untitled',
      kind: type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item',
      status,
      updated: timeAgo(c.updatedAt ?? c.createdAt),
      projectId: isProject && linkId ? String(linkId) : null,
    }
  })
}