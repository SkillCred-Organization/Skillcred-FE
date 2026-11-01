import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import AuthPageLayout from './AuthPageLayout'
import { AuthAlert, BackLink } from './AuthControls'
import { authApi, authDestination } from '../../lib/auth'
import { ApiError, tokenStore } from '../../lib/apiClient'
import { useAuth } from '../../features/auth/authContext'
import { useResendCountdown } from '../../features/auth/useResendCountdown'

export default function VerificationPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const location = useLocation()
  const state = location.state as { email?: string; institutionName?: string; resendAvailableAt?: number } | null
  const navigate = useNavigate()
  const { user, loading, error: accountError, refresh } = useAuth()
  const email = state?.email || user?.email
  const [result, setResult] = useState<{ token: string; outcome: 'verified' | 'error'; message?: string } | null>(null)
  const outcome = result?.token === token ? result.outcome : 'pending'
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const { remaining, restart } = useResendCountdown(state?.resendAvailableAt)
  const request = useRef<{ token: string; promise: ReturnType<typeof authApi.verifyEmail> } | null>(null)
  useEffect(() => {
    if (!token) return
    let active = true
    // Strict Mode replays effects; reuse the request so a one-use link is redeemed once.
    if (request.current?.token !== token) request.current = { token, promise: authApi.verifyEmail(token) }
    request.current.promise.then(async () => {
      if (!active) return
      // The verification endpoint confirms the email, but does not issue a login token.
      // Refresh the existing session before entering a protected dashboard.
      await refresh()
      if (active) setResult({ token, outcome: 'verified' })
    }).catch(async error => {
      if (!active) return
      // A single-use link may have already verified this signed-in account.
      if (error instanceof ApiError && error.status === 400 && tokenStore.get()) {
        try {
          const account = await authApi.me()
          if (account.user.emailVerified) {
            if (!active) return
            await refresh()
            if (active) setResult({ token, outcome: 'verified' })
            return
          }
        } catch { /* Keep the original verification error. */ }
      }
      if (active) setResult({ token, outcome: 'error', message: error instanceof Error ? error.message : 'This verification link is invalid or expired.' })
    })
    return () => { active = false }
  }, [token, refresh])
  const verified = token ? outcome === 'verified' : !!user?.emailVerified
  useEffect(() => {
    if (token && verified && !loading && !accountError && user?.emailVerified) {
      navigate(authDestination(user), { replace: true })
    }
  }, [token, verified, loading, accountError, user, navigate])
  async function resend() {
    if (!email || busy || remaining) return
    setBusy(true); setMessage('')
    try { await authApi.resendVerification(email); restart() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to resend the verification email.') }
    finally { setBusy(false) }
  }
  const canRetryAccount = verified && !!tokenStore.get() && !loading && (!!accountError || !user?.emailVerified)
  const description = verified
    ? loading ? 'Your email has been confirmed. Loading your account…'
      : canRetryAccount ? 'Your email has been confirmed. Refresh your account to continue.'
        : !user ? 'Your email has been confirmed. Log in to open your dashboard in this browser.'
          : 'Your email has been confirmed. You can continue to your account.'
    : email ? `Follow the verification link sent to ${email} to confirm your account.` : 'Open the verification link in your email to confirm your account.'
  return <AuthPageLayout><section className="auth-panel auth-status">
    <div className="auth-status-icon">{verified ? <Check aria-hidden="true" /> : <Mail aria-hidden="true" />}</div>
    <h1>{verified ? 'Email verified' : token && outcome === 'pending' ? 'Verifying your email…' : 'Check your inbox'}</h1>
    <p className="auth-description">{description}</p>
    <AuthAlert message={message || (result?.token === token ? result.message : '') || (verified ? accountError : '')} />
    {!verified && email && <p className="auth-status-note">{remaining ? `You can resend in 0:${String(remaining).padStart(2, '0')}.` : <button className="auth-link" disabled={busy} onClick={() => void resend()}>{busy ? 'Sending…' : 'Resend verification email'}</button>}</p>}
    {canRetryAccount && <button className="auth-submit" onClick={() => void refresh()}>Try again</button>}
    {verified && !loading && !user && !accountError && <Link to="/login" className="auth-submit inline-flex items-center justify-center rounded-full bg-brand text-white">Log in</Link>}
    {!token && user && !loading && !accountError && (verified || user.role === 'learner') && <Link to={authDestination(user)} className="auth-submit inline-flex items-center justify-center rounded-full bg-brand text-white">Continue</Link>}
    {!verified && <BackLink to="/login" />}
  </section></AuthPageLayout>
}
