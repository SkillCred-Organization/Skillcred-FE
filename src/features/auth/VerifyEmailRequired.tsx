import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MailWarning } from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import InlineAlert from '../../components/ui/InlineAlert'
import { authApi } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import { useAuth } from './authContext'

// Shown in place of a learner page until the learner confirms their email (the API answers 403 EMAIL_NOT_VERIFIED).
export default function VerifyEmailRequired({ page }: { page: string }) {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const email = user?.email ?? ''

  async function verify() {
    setBusy(true); setMessage('')
    try {
      await authApi.resendVerification(email)
      navigate('/verify-email', { state: { email, resendAvailableAt: Date.now() + 45000 } })
    } catch (error) {
      // "Already verified": the email was confirmed elsewhere, so reload the account to unlock the page.
      if (error instanceof ApiError && error.status === 400) await refresh()
      else setMessage(error instanceof Error ? error.message : 'Unable to send the verification email.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl pt-10">
      <EmptyState
        icon={MailWarning}
        title={`Verify your email to use ${page}`}
        message={`You're signed in, but ${page} stays locked until you confirm ${email || 'your email address'}. We'll send you a link.`}
        action={
          <div className="flex flex-col items-center gap-3">
            <Button loading={busy} onClick={() => void verify()}>Verify my email</Button>
            <button type="button" className="text-sm text-ink-muted underline hover:text-ink" onClick={() => void refresh()}>
              I've already verified
            </button>
          </div>
        }
      />
      {message && <div className="mt-4"><InlineAlert variant="error" title={message} /></div>}
    </div>
  )
}
