import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './apiClient'

export const emailRules = {
  required: 'Enter your email address',
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
  setValueAs: (value: string) => value.trim(),
}
export const passwordRules = {
  required: 'Create a password',
  minLength: { value: 8, message: 'Use at least 8 characters' },
  validate: (value: string) => /\d/.test(value) || 'Include a number in your password',
}
export const nameRules = { required: 'Enter your name', validate: (value: string) => !!value.trim() || 'Enter your name' }

export function applyFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  const apiError = error instanceof ApiError ? error : new ApiError(0, 'Something went wrong. Please try again.')
  let first = true
  for (const field of fields) {
    const messages = apiError.fieldErrors?.[field]
    if (Array.isArray(messages) && messages.length) {
      setError(field, { type: 'server', message: messages.join('. ') }, { shouldFocus: first })
      first = false
    }
  }
  return apiError
}
