import { mockProjects, mockVerification} from './mockData'
import type { NewProject, Project, Institution, OnboardingData, LearnerProfile} from '../types'
import { apiClient } from './apiClient'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// MOCK: the backend hasn't built projects yet.
// This list lives in memory only, so a page refresh resets it.
let projects: Project[] = [...mockProjects]

export async function getProjects(): Promise<Project[]> {
  await wait(800)
  return [...projects]
}

function metaFor(input: NewProject) {
  if (input.status === 'draft') return 'Draft · only you can see it'
  if (input.status === 'pending') return `Sent to ${mockVerification.institution} · just now`
  return input.teammates.length ? 'Team project' : 'Personal project'
}

export async function addProject(input: NewProject): Promise<Project> {
  await wait(600)
  const project: Project = {
    id: crypto.randomUUID(),
    title: input.title.trim() || 'Untitled project',
    summary: input.summary || 'No summary yet',
    status: input.status,
    meta: metaFor(input),
  }
  projects = [project, ...projects]
  return project
}

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

// Builds the request body from the form data, one allowed field at a time.
// I have not sent the form data as it is. Full name and photo are NOT accepted by this endpoint.
export function buildProfilePayload(data: OnboardingData): ProfilePayload {
  const payload: ProfilePayload = {}
  if (data.headline.trim()) payload.headline = data.headline.trim()
  if (data.location.trim()) payload.location = data.location.trim()
  if (data.skills.length) payload.skills = data.skills

  if (data.institution?.name) {
    const institution: NonNullable<ProfilePayload['institution']> = { name: data.institution.name }
    if (data.institution.id) institution.institutionId = data.institution.id
    if (data.programme) institution.programme = data.programme
    if (data.year) institution.cohort = data.year // ASSUMPTION: year goes into cohort. Confirm with backend.
    // data.track is not sent yet: the API has no field for it. Confirm with backend.
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
