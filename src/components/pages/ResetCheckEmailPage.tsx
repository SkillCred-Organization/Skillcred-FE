import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Mail } from 'lucide-react'
import AuthPageLayout from './AuthPageLayout'
import Button from '../ui/Button'
import { AuthAlert } from './AuthControls'
import { authApi } from '../../lib/auth'
import { useResendCountdown } from '../../features/auth/useResendCountdown'
export default function ResetCheckEmailPage() {
  const state = useLocation().state as { email?: string; resendAt?: number } | null
  const email = state?.email
  const { remaining, restart } = useResendCountdown(state?.resendAt)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState(false)
  if (!email) return <Navigate to="/forgot-password" replace />
  async function resend() {
    if (busy || remaining || !email) return
    setBusy(true); setError('')
    try { await authApi.forgotPassword(email); restart() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to resend. Please try again.') }
    finally { setBusy(false) }
  }
  return <AuthPageLayout><section className="auth-panel auth-status">
    <div className="auth-status-icon"><Mail aria-hidden="true" /></div><h1>Check your inbox</h1>
    <p className="auth-description">We sent a reset link to {email}. It expires in 30 minutes.</p>
    <AuthAlert message={error} />
    <Button variant="outline" className="auth-submit" onClick={() => setHint(true)}>Open the link</Button>
    {hint && <p role="status" className="auth-status-note">Open the email from SkillCred and follow its secure reset link to choose your new password.</p>}
    <p className="auth-status-note" aria-live="off">Didn’t get it? Check spam, or {remaining ? `resend in 0:${String(remaining).padStart(2, '0')}.` : <button className="auth-link" disabled={busy} onClick={() => void resend()}>{busy ? 'resending…' : 'resend the link'}</button>}</p>
    <Link className="auth-back auth-link" to="/forgot-password">Use a different email</Link>
  </section></AuthPageLayout>
}
