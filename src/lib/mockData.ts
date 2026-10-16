import type { Activity } from '../types'

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


export const mockInstitutions = [
  { id: 'inst-1', name: 'AltSchool Africa' },
  { id: 'inst-2', name: 'Lagos Tech Institute' },
  { id: 'inst-3', name: 'ALX' },
  { id: 'inst-4', name: 'HNG Academy' },
  { id: 'inst-5', name: 'Aptech Learning' },
  { id: 'inst-6', name: 'AppClick ICT Academy' },
]