// A custom error that carries what the backend says
export class ApiError extends Error {
  status: number                              // e.g. 400, 401, 404
  code?: string                               // e.g. 'FREE_EMAIL'
  fieldErrors?: Record<string, string[]>      // e.g. { website: ['Must start with https://'] }

  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string   // from .env.local
const TOKEN_KEY = 'auth_token'

// this where the login token is saved in the browser
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// The messenger: every backend call goes through here
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStore.clear()
      window.location.assign('/login')
    }
    throw new ApiError(response.status, data.message || 'An unexpected error occurred', data.code, data.errors)
  }
  return data as T
}