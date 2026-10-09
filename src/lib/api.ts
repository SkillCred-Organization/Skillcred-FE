import { mockProjects } from './mockData'
import type { Project } from '../types'

export const API_URL = import.meta.env.VITE_API_URL as string

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// MOCK: the backend hasn't built projects yet.
// When it does, I will replace the body with a real fetch to `${API_URL}/...`
export async function getProjects(): Promise<Project[]> {
  await wait(800)
  return mockProjects
}