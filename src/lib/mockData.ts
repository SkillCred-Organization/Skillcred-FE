import type { Activity, Project } from '../types'

export const mockUser = { name: 'Adaeze Okafor', role: 'Learner', initials: 'AO' }

export const mockCounts = {
  projects: 4,
  certifications: 2,
  skills: 8,
  achievements: 2,
  verification: 1,
}


export const mockVerification = {
  institution: 'Lagos Tech Institute',
  verified: 4,
  total: 7,
  waiting: 2,
  needsChanges: 1,
}

export const mockStats = {
  projects: { value: 4, sub: '1 verified · 1 pending' },
  certifications: { value: 2, sub: '1 verified' },
  skills: { value: 8, sub: '5 verified' },
  achievements: { value: 2, sub: '1 pending' },
}

export const mockActivity: Activity[] = [
  { id: '1', kind: 'verified', text: 'Payments API capstone was verified by Lagos Tech Institute', time: '2 days ago' },
  { id: '2', kind: 'confirmed', text: 'Fatima Sani confirmed your role on Inventory tracker', time: 'Yesterday' },
  { id: '3', kind: 'needs-changes', text: 'Cloud Practitioner needs changes', time: '1 day ago', action: 'Fix' },
  { id: '4', kind: 'draft', text: 'Draft saved: Library booking API', time: 'Just now', action: 'Continue' },
]

export const mockProfileLink = 'skillcred.app/u/adaeze-okafor'

export const mockProjects: Project[] = [
  { id: '1', title: 'Payments API capstone', summary: 'REST API with auth, ledgers and webhooks.', status: 'verified', meta: 'via Lagos Tech Institute · verified 2 days ago' },
  { id: '2', title: 'Inventory tracker', summary: 'Stock app for a campus shop, built with 2 teammates.', status: 'pending', meta: 'Sent to Lagos Tech Institute · 3 days ago' },
  { id: '3', title: 'Weather dashboard', summary: 'Built after graduating.', status: 'self-reported', meta: 'Personal project' },
  { id: '4', title: 'Library booking API', summary: 'Room booking service with email reminders.', status: 'draft', meta: 'Draft · only you can see it' },
]