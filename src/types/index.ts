export type Status =
  | 'verified'
  | 'team-confirmed'
  | 'pending'
  | 'needs-changes'
  | 'self-reported'
  | 'draft'

  export type Activity = {
  id: string
  kind: 'verified' | 'confirmed' | 'needs-changes' | 'draft' | 'info'
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
  details?: DetailValues
  institutionId?: string
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
    institution?: { institutionId?: string; id?: string; name?: string; programme?: string; cohort?: string; selfReported?: boolean }
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
  details: Record<string, string>
}

export type DashboardStat = { total: number; verified: number }

export type Dashboard = {
  stats: {
    projects: DashboardStat
    certifications: DashboardStat
    skills: DashboardStat
    achievements: DashboardStat
  }

  banner: { verified: number; waiting: number; needsChanges: number }
  drafts: number
  activity: Activity[]
}

export type Claim = {
  id: string
  title: string
  kind: string
  status: Status
  updated: string
  projectId: string | null
}

export type DetailValues = Partial<Record<string, string>>

export type ShareSettings = {
  isPublic: boolean
  showPendingAndSelfReported: boolean
  showEmail: boolean
}

export type PublicItem = {
  id: string
  title: string
  summary: string
  status: Status
  verifiedBy: string
}

export type PublicProfile = {
  fullName: string
  handle: string
  headline: string
  location: string
  bio: string
  email: string
  institution: string
  projects: PublicItem[]
  certifications: PublicItem[]
  achievements: PublicItem[]
  skills: { name: string; verified: boolean }[]
  stats: { verified: number; total: number }
}

export type SkillItem = { name: string; verified: boolean }
