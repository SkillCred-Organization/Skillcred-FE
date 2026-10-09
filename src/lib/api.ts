import { mockProjects, mockVerification } from './mockData'
import type { NewProject, Project } from '../types'

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