import { ApiError } from './apiClient'

type Fields = Record<string, string[]>
type ErrorShape = {
  fieldErrors?: Fields
  errors?: Fields
  data?: { errors?: Fields; details?: { missing?: string[] } }
}

export function errorText(err: unknown, fallback: string) {
  if (!(err instanceof ApiError)) return fallback
  const shape = err as unknown as ErrorShape
  const missing = shape.data?.details?.missing
  if (missing?.length) return `Still needed before this can be sent: ${missing.join(', ')}.`
  const fields = shape.fieldErrors ?? shape.errors ?? shape.data?.errors
  const first = fields ? Object.values(fields).flat()[0] : undefined
  return first || err.message || fallback
}