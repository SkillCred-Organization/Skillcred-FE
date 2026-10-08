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