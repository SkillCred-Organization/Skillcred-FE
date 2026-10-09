import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useForm } from 'react-hook-form'
import AuthPageLayout from './AuthPageLayout'
import { AuthAlert, AuthField, AuthSubmit } from './AuthControls'
import { authApi } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import { applyFieldErrors, passwordRules } from '../../lib/authForm'
import { useAuth } from '../../features/auth/authContext'
type Values = { password: string; confirmPassword: string }
export default function NewPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [message, setMessage] = useState('')
  const [invalidToken, setInvalidToken] = useState(false)
  const { register, handleSubmit, getValues, setError, formState: { errors, isSubmitting } } = useForm<Values>()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const missingLink = !token || invalidToken
  return <AuthPageLayout><section className="auth-panel auth-new-password">
    <h1>Choose a new password</h1>
    <AuthAlert message={missingLink ? 'This reset link is missing, invalid, or expired.' : message} detail={missingLink ? <Link className="auth-link" to="/forgot-password">Request a new reset link</Link> : undefined} />
    <form className="auth-form" noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(async ({ password }) => {
      if (missingLink) return
      setMessage('')
      try { await authApi.resetPassword(token, password); logout(); navigate('/password-updated', { replace: true }) }
      catch (error) {
        if (error instanceof ApiError && error.code === 'RESET_LINK_INVALID') setInvalidToken(true)
        setMessage(applyFieldErrors(error, setError, ['password', 'confirmPassword']).message)
      }
    })}>
      <fieldset className="auth-fields" disabled={isSubmitting || missingLink}>
        <AuthField label="New password" type="password" placeholder="Create a password" autoComplete="new-password" icon={<LockKeyhole />} helperText="At least 8 characters, with a number" {...register('password', passwordRules)} error={errors.password?.message} />
        <AuthField label="Confirm password" type="password" placeholder="Confirm your password" autoComplete="new-password" icon={<LockKeyhole />} {...register('confirmPassword', { required: 'Confirm your password', validate: value => value === getValues('password') || 'Your passwords don’t match' })} error={errors.confirmPassword?.message} />
      </fieldset>
      {!missingLink && <AuthSubmit busy={isSubmitting} busyText="Saving password…">Save password</AuthSubmit>}
    </form>
    <p className="auth-reset-note">You’ll be logged out of other devices.</p>
  </section></AuthPageLayout>
}
