import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import InlineAlert from '../../components/ui/InlineAlert'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { ApiError, tokenStore } from '../../lib/apiClient'
import { confirmDelete, requestDeleteCode } from '../../lib/account'

type Step = 'warn' | 'code'

const toNumber = (v: unknown) => (typeof v === 'number' ? v : Number(v))

export default function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('warn')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  function handleError(err: unknown) {
    if (!(err instanceof ApiError)) {
      setError('Something went wrong. Please try again.')
      return
    }
    const details = err.details ?? {}
    switch (err.code) {
      case 'CANCEL_SUBSCRIPTION_FIRST':
        setError('Your account could not be deleted. Please contact support for help with your billing record.')
        break
      case 'CODE_RECENTLY_SENT': {
        const wait = toNumber(details.retryAfterSeconds)
        setCooldown(Number.isFinite(wait) && wait > 0 ? Math.ceil(wait) : 60)
        setStep('code')
        setError('A code was sent a moment ago. Check your email, or ask for a new one when the timer ends.')
        break
      }
      case 'INVALID_CODE': {
        const left = toNumber(details.attemptsLeft)
        setCode('')
        setError(
          Number.isFinite(left)
            ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.`
            : 'That code is not right.',
        )
        break
      }
      case 'TOO_MANY_ATTEMPTS':
        setCode('')
        setError('Too many wrong codes. Ask for a new code.')
        break
      case 'CODE_EXPIRED':
        setCode('')
        setError('That code has expired. Ask for a new code.')
        break
      case 'NO_CODE_REQUESTED':
        setStep('warn')
        setError('Ask for a code first.')
        break
      case 'EMAIL_NOT_CONFIGURED':
        setError("We can't send your code right now. Please try again later.")
        break
      case 'INSTITUTION_ACCOUNT':
        setError("Institution accounts can't be deleted here.")
        break
      default:
        setError(err.status === 400 && !err.code ? 'Enter the 6-digit code from your email.' : err.message)
    }
  }

  async function sendCode() {
    setBusy(true)
    setError('')
    try {
      const result = await requestDeleteCode()
      setEmail(result.email)
      setCode('')
      setStep('code')
      setCooldown(60)
    } catch (err) {
      handleError(err)
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await confirmDelete(code)
      tokenStore.clear()
      window.location.assign('/account-deleted') // a full reload also forgets the user
    } catch (err) {
      handleError(err)
      setBusy(false)
    }
  }

  const footer =
    step === 'warn' ? (
      <>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={busy} onClick={sendCode}>
          Send me a code
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" disabled={busy || cooldown > 0} onClick={sendCode}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
        <Button loading={busy} disabled={code.length !== 6} onClick={confirm}>
          Delete my account
        </Button>
      </>
    )

  return (
    <Modal title={step === 'warn' ? 'Delete your account?' : 'Enter your code'} onClose={onClose} footer={footer}>
      <div className="space-y-4">
        {error && (
          <InlineAlert
            variant="error"
            title={error}
          />
        )}

        {step === 'warn' ? (
          <>
            <p className="text-sm text-ink">This permanently deletes your profile, projects and verifications. This cannot be undone.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
              <li>Your profile and its public link</li>
              <li>Every project, certification, achievement and programme</li>
              <li>Verified items also disappear from your institution&apos;s records</li>
              <li>Your notifications</li>
            </ul>
            <p className="text-xs text-ink-muted">Payment records (reference and amount only) are kept for accounting.</p>
            <Link to="/app/settings?tab=security" onClick={onClose} className="inline-block text-sm font-medium text-brand underline">
              Download my data first
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-ink">
              {email ? `We sent a code to ${email}.` : 'We sent a code to your email.'} It is valid for 10 minutes.
            </p>
            <Input
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
            />
          </>
        )}
      </div>
    </Modal>
  )
}
