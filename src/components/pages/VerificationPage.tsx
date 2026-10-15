import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import AuthPageLayout from './AuthPageLayout'
import { AuthAlert, BackLink } from './AuthControls'
import { authApi, authDestination } from '../../lib/auth'
import { useAuth } from '../../features/auth/authContext'
import { useResendCountdown } from '../../features/auth/useResendCountdown'

export default function VerificationPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const location = useLocation()
  const state = location.state as { email?: string; institutionName?: string } | null
  const { user, refresh } = useAuth()
  const email = state?.email || user?.email
  const [outcome, setOutcome] = useState<'pending' | 'verified' | 'error'>(token ? 'pending' : 'error')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const { remaining, restart } = useResendCountdown()
  const request = useRef<{ token: string; promise: ReturnType<typeof authApi.verifyEmail> } | null>(null)
  useEffect(() => {
    if (!token) return
    let active = true
    // Strict Mode replays effects; reuse the request so a one-use link is redeemed once.
    if (request.current?.token !== token) request.current = { token, promise: authApi.verifyEmail(token) }
    request.current.promise.then(() => {
      if (active) { setOutcome('verified'); void refresh() }
    }).catch(async error => {
      // A single-use link may have already verified this signed-in account.
      try {
        const result = await authApi.me()
        if (result.user.emailVerified) {
          if (active) { setOutcome('verified'); void refresh() }
          return
        }
      } catch { /* Keep the original verification error. */ }
      if (active) { setOutcome('error'); setMessage(error instanceof Error ? error.message : 'This verification link is invalid or expired.') }
    })
    return () => { active = false }
  }, [token, refresh])
  async function resend() {
    if (!email || busy || remaining) return
    setBusy(true); setMessage('')
    try { await authApi.resendVerification(email); restart() }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to resend the verification email.') }
    finally { setBusy(false) }
  }
  const verified = (!!token && outcome === 'verified') || !!user?.emailVerified
  return <AuthPageLayout><section className="auth-panel auth-status">
    <div className="auth-status-icon">{verified ? <Check aria-hidden="true" /> : <Mail aria-hidden="true" />}</div>
    <h1>{verified ? 'Email verified' : token && outcome === 'pending' ? 'Verifying your email…' : 'Check your inbox'}</h1>
    <p className="auth-description">{verified ? 'Your email has been confirmed. You can continue to your account.' : email ? `Follow the verification link sent to ${email} to confirm your account.` : 'Open the verification link in your email to confirm your account.'}</p>
    <AuthAlert message={message} />
    {!verified && email && <p className="auth-status-note">{remaining ? `You can resend in 0:${String(remaining).padStart(2, '0')}.` : <button className="auth-link" disabled={busy} onClick={() => void resend()}>{busy ? 'Sending…' : 'Resend verification email'}</button>}</p>}
    {(verified || user?.role === 'learner') && <Link to={user ? authDestination({ ...user, emailVerified: verified }) : '/login'} className="auth-submit inline-flex items-center justify-center rounded-full bg-brand text-white">Continue</Link>}
    <BackLink to="/login" />
  </section></AuthPageLayout>
}
