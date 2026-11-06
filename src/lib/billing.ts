import { ApiError, apiClient } from './apiClient'

export type Plan = {
  id: string
  name: string
  priceNgn: number
  interval: string | null
  projectLimit: number | null // null = unlimited
}
export type PlansResponse = { currency: string; billingEnabled: boolean; plans: Plan[] }

export type BillingMe = {
  billingEnabled: boolean
  plan: string
  status: string | null
  paidThrough: string | null
  projects: { used: number; limit: number | null }
  canUpgrade: boolean
}

// Verification does not return billingEnabled or paidThrough. Refresh /me after payment.
export type VerifyResult = Pick<BillingMe, 'plan' | 'status' | 'projects' | 'canUpgrade'> & {
  paid: boolean
  paymentStatus: string
}

export const getPlans = () => apiClient<PlansResponse>('/api/billing/plans', { auth: false })
export const getBilling = () => apiClient<BillingMe>('/api/billing/me')
export const verifyPayment = (reference: string) =>
  apiClient<VerifyResult>(`/api/billing/verify?reference=${encodeURIComponent(reference)}`)

// Only follow addresses that start with https://, so a wrong reply can never send a learner somewhere unsafe
function safeUrl(url: unknown): string {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) throw new Error('The payment page address was not valid.')
  return url
}

export async function startCheckout(): Promise<string> {
  const data = await apiClient<{ authorizationUrl: string; reference: string }>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  return safeUrl(data.authorizationUrl)
}

export const isPlanLimit = (err: unknown) =>
  err instanceof ApiError && (err.code === 'PLAN_LIMIT_REACHED' || err.status === 402)

export function billingErrorText(err: unknown, fallback: string) {
  const code = err instanceof ApiError ? err.code : undefined
  switch (code) {
    case 'ALREADY_PREMIUM':
      return 'You already have Premium.'
    case 'PAYMENT_PROVIDER_ERROR':
      return "We couldn't start your payment. Please try again."
    case 'BILLING_NOT_CONFIGURED':
      return "Payments aren't switched on yet."
    default:
      return err instanceof ApiError && err.message ? err.message : fallback
  }
}

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)

export const atProjectLimit = (b: BillingMe | null) =>
  Boolean(b && b.projects.limit !== null && b.projects.used >= b.projects.limit)
