import { apiClient, ApiError, AUTH_USER_KEY, tokenStore } from './apiClient.ts'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: 'learner' | 'admin'
  emailVerified: boolean
  needsInstitution?: boolean
  institutionId?: string | null
  institutionRole?: 'owner' | 'reviewer' | null
}
export type AuthResponse = { token: string; user: AuthUser; institution?: { id: string; name: string; status: string } }
export type LearnerRegistration = { fullName: string; email: string; password: string; acceptedTerms: boolean }
export type AdminRegistration = {
  institutionName: string; website: string; registrationNumber?: string
  fullName: string; jobTitle: string; email: string; password: string; authorised: boolean
}
// Allow a sleeping host time to start; never automatically repeat account mutations.
const AUTH_TIMEOUT_MS = 90000
const post = <T>(endpoint: string, body: unknown, auth = false) =>
  apiClient<T>(endpoint, { method: 'POST', body: JSON.stringify(body), auth, timeoutMs: AUTH_TIMEOUT_MS })

export const authApi = {
  login: (values: { email: string; password: string }) => post<AuthResponse>('/api/auth/login', values),
  registerLearner: (values: LearnerRegistration) => post<AuthResponse>('/api/auth/register/learner', values),
  registerAdmin: (values: AdminRegistration) => post<AuthResponse>('/api/auth/register/admin', values),
  google: (values: { credential: string; role?: AuthUser['role']; acceptedTerms?: boolean }) => post<AuthResponse>('/api/auth/google', values),
  me: (signal?: AbortSignal) => apiClient<{ user: AuthUser }>('/api/auth/me', { signal, timeoutMs: AUTH_TIMEOUT_MS }),
  verifyEmail: (token: string) => apiClient<{ message: string; institutionStatus?: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { auth: false, timeoutMs: AUTH_TIMEOUT_MS }),
  resendVerification: (email: string) => post<{ message: string }>('/api/auth/resend-verification', { email }, true),
  forgotPassword: (email: string) => post<{ message: string }>('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => post<{ message: string }>('/api/auth/reset-password', { token, password }),
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<AuthUser>
  return typeof user.id === 'string' && typeof user.fullName === 'string'
    && typeof user.email === 'string' && (user.role === 'learner' || user.role === 'admin')
}

export function saveUser(user: AuthUser) {
  if (!isAuthUser(user)) throw new ApiError(200, 'The server did not return a valid account. Please try again.')
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  return user
}

export function readStoredUser(): AuthUser | null {
  if (!tokenStore.get()) return null
  try {
    const user: unknown = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null')
    return isAuthUser(user) ? user : null
  } catch { return null }
}

export function saveSession({ token, user }: AuthResponse) {
  if (typeof token !== 'string' || !token || !isAuthUser(user)) throw new ApiError(200, 'The server did not return a valid session. Please try again.')
  tokenStore.set(token)
  try { return saveUser(user) }
  catch (error) { tokenStore.clear(); throw error }
}

export function authDestination(user: AuthUser, flow: 'login' | 'signup' = 'login', returnTo?: unknown) {
  if (user.role === 'admin' && !user.emailVerified) return '/verify-email'
  if (flow === 'signup' && !user.emailVerified) return '/verify-email' // learners can still log in and look around
  // Only resume an internal protected page that belongs to this account's role.
  // New registrations still follow onboarding instead of resuming a payment.
  if (flow === 'login' && typeof returnTo === 'string' && returnTo.startsWith('/')
    && !returnTo.startsWith('//') && !/[\\\s]/.test(returnTo)) {
    try {
      const url = new URL(returnTo, 'https://return.invalid')
      const allowed = user.role === 'admin'
        ? /^\/admin(?:\/|$)/.test(url.pathname)
        : /^\/app(?:\/|$)/.test(url.pathname) || ['/billing/success', '/onboarding'].includes(url.pathname)
      if (url.origin === 'https://return.invalid' && allowed) return url.pathname + url.search + url.hash
    } catch { /* Fall back to the normal account destination. */ }
  }
  if (user.role === 'admin') {
    return '/admin/dashboard'
  }
  if (flow === 'login') return '/app/dashboard'
  return '/onboarding'
}

export function websiteDomain(value: string) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) return ''
    return url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
  } catch { return '' }
}
export function emailMatchesWebsite(email: string, website: string) {
  const domain = websiteDomain(website)
  const emailDomain = email.trim().toLowerCase().split('@')[1]
  return !!domain && !!emailDomain && (emailDomain === domain || emailDomain.endsWith('.' + domain))
}
