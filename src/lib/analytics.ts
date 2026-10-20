type AnalyticsEvent = 'login' | 'sign_up' | 'claim_review_opened' | 'claim_verified' | 'claim_changes_requested' | 'institution_updated' | 'programme_saved' | 'account_updated' | 'password_changed' | 'data_exported'
type AnalyticsParameters = { method?: 'password' | 'google'; account_type?: 'admin' | 'learner'; claim_type?: string }

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

// Never send names, email addresses, passwords, claim IDs, evidence links or URL query tokens.
export function trackEvent(event: AnalyticsEvent, parameters: AnalyticsParameters = {}) {
  if (typeof window !== 'undefined' && import.meta.env?.PROD) window.gtag?.('event', event, parameters)
}

export function analyticsPagePath(pathname: string) {
  const path = pathname.split(/[?#]/)[0]
  if (/^\/admin\/claims\/[^/]+\/?$/.test(path)) return '/admin/claims/:claim'
  if (/^\/u\/[^/]+\/?$/.test(path)) return '/u/:profile'
  const known = ['/', '/login', '/signup', '/signup/learner', '/user-type', '/institution-signup', '/forgot-password', '/reset/check-email', '/reset-password', '/password-updated', '/verify-email', '/account-status', '/terms', '/privacy', '/onboarding', '/app/dashboard', '/app/projects', '/app/certifications', '/app/skills', '/app/achievements', '/app/verification', '/app/share', '/app/profile', '/app/settings', '/admin/dashboard', '/admin/queue', '/admin/learners', '/admin/institution', '/admin/settings', '/admin/notifications', '/admin/profile', '/confirm-teammate']
  return known.includes(path) ? path : '/other'
}
