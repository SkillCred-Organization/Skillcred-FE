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

export type Project = {
  id: string
  title: string
  summary: string
  status: Status
  meta: string
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