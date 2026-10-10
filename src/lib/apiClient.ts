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

const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')
export const AUTH_TOKEN_KEY = 'auth_token'
export const AUTH_USER_KEY = 'auth_user'
export const SESSION_EXPIRED_EVENT = 'skillcred:session-expired'
const TOKEN_KEY = AUTH_TOKEN_KEY

// this where the login token is saved in the browser
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  },
}


// Public auth requests opt out of Bearer headers; protected expiry notifies the router.
type ApiOptions = RequestInit & { auth?: boolean; timeoutMs?: number }

export function apiUrl(endpoint: string, base = API_BASE_URL) {
  if (!endpoint.startsWith('/api/')) throw new Error('API endpoints must start with /api/.')
  return base.replace(/\/+$/, '').replace(/\/api$/, '') + endpoint
}

export async function apiClient<T>(endpoint: string, { auth = true, timeoutMs = 20000, ...options }: ApiOptions = {}): Promise<T> {
  const token = auth ? tokenStore.get() : null
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal
  let response: Response
  let data
  try {
    response = await fetch(apiUrl(endpoint), { ...options, headers, signal })
    data = await response.json().catch(error => {
      if (signal.aborted) throw error
      return null
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    if (timeoutSignal.aborted) {
      throw new ApiError(0, 'SkillCred is taking longer than expected to respond. Please try again.', 'REQUEST_TIMEOUT')
    }
    throw new ApiError(0, 'We couldn’t reach SkillCred. Please try again shortly.', 'NETWORK_ERROR')
  }
  if (!response.ok) {
    if (response.status === 401 && token && tokenStore.get() === token) {
      tokenStore.clear()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw new ApiError(response.status, data?.message || 'Something went wrong. Please try again.', data?.code, data?.errors)
  }
  if (data === null && response.status !== 204) throw new ApiError(response.status, 'The server returned an unexpected response. Please try again.')
  return data as T
}
