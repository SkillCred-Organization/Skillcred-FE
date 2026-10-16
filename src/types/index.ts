export type Status =
  | 'verified'
  | 'team-confirmed'
  | 'pending'
  | 'needs-changes'
  | 'self-reported'
  | 'draft'

  export type Activity = {
  id: string
  kind: 'verified' | 'confirmed' | 'needs-changes' | 'draft'
  text: string
  time: string
  action?: string
}

export type ProjectActions = {
  edit: boolean
  requestVerification: boolean
  withdraw: boolean
  delete: boolean
}

export type Project = {
  id: string
  title: string
  summary: string
  status: Status
  meta: string
  actions: ProjectActions
}

export type Teammate = { name: string; email: string; role: string }

export type NewProject = {
  title: string
  summary: string
  role: string
  track: string
  startDate: string
  endDate: string
  link: string
  teammates: Teammate[]
  status: 'pending' | 'self-reported' | 'draft'
}

export type Institution = { id: string | null; name: string }

export type OnboardingData = {
  headline: string
  location: string
  institution: Institution | null
  programme: string
  track: string
  year: string
  skills: string[]
}

export type LearnerProfile = {
  headline?: string
  location?: string
  bio?: string
  handle?: string
  skills?: string[]
  institution?: { institutionId?: string; name?: string; programme?: string; cohort?: string }
}

export type ProjectDetail = Project & {
  role: string
  track: string
  projectType: string
  startDate: string
  endDate: string
  proofLink: string
  techStack: string[]
  teammates: Teammate[]
  decision?: { reason: string; message: string }
}