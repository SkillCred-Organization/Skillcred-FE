import { ApiError } from './apiClient'

type Fields = Record<string, string[]>

const labels: Record<string, string> = {
  title: 'Project title',
  summary: 'One-line summary',
  role: 'Your role',
  track: 'Track',
  startDate: 'Start date',
  endDate: 'End date',
  proofLink: 'Project link',
  link: 'Project link',
}
const readable = (key: string) => labels[key] ?? key.replace(/([A-Z])/g, ' $1').toLowerCase()

// The backend's error can sit in different places inside the error object, so search for it.
function findMissing(value: unknown, depth = 0): string[] | undefined {
  if (!value || typeof value !== 'object' || depth > 3) return undefined
  const obj = value as Record<string, unknown>
  const m = obj.missing
  if (Array.isArray(m) && m.length > 0 && m.every((x) => typeof x === 'string')) return m as string[]
  for (const nested of Object.values(obj)) {
    const found = findMissing(nested, depth + 1)
    if (found) return found
  }
  return undefined
}

function looksLikeFieldErrors(obj: Record<string, unknown>) {
  const entries = Object.entries(obj)
  return (
    entries.length > 0 &&
    entries.every(([, v]) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string'))
  )
}

function findFieldErrors(value: unknown, depth = 0): Fields | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 3) return undefined
  const obj = value as Record<string, unknown>
  if (depth > 0 && looksLikeFieldErrors(obj)) return obj as Fields
  for (const nested of Object.values(obj)) {
    const found = findFieldErrors(nested, depth + 1)
    if (found) return found
  }
  return undefined
}

export function errorText(err: unknown, fallback: string) {
  if (!(err instanceof ApiError)) return fallback
  const missing = findMissing(err)
  if (missing) return `Still needed before this can be sent: ${missing.map(readable).join(', ')}.`
  const fields = findFieldErrors(err)
  const first = fields ? Object.entries(fields)[0] : undefined
  if (first && first[1][0]) return `${readable(first[0])}: ${first[1][0]}`
  return err.message || fallback
}

// True when the backend says the learner must choose an institution (INSTITUTION_REQUIRED)
export function needsInstitution(err: unknown) {
  if (!(err instanceof ApiError)) return false
  const code = (err as unknown as { code?: string }).code
  return code === 'INSTITUTION_REQUIRED' || /choose the institution/i.test(err.message)
}