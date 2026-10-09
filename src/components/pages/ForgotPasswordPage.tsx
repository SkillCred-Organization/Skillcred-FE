import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import AuthPageLayout from './AuthPageLayout'
import { AuthAlert, AuthField, AuthSubmit, BackLink } from './AuthControls'
import { authApi } from '../../lib/auth'
import { applyFieldErrors, emailRules } from '../../lib/authForm'
export default function ForgotPasswordPage() {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<{ email: string }>()
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  async function submit({ email }: { email: string }) {
    setMessage('')
    try { await authApi.forgotPassword(email); navigate('/reset/check-email', { state: { email, resendAt: Date.now() + 45000 } }) }
    catch (error) { setMessage(applyFieldErrors(error, setError, ['email']).message) }
  }
  return <AuthPageLayout><section className="auth-panel auth-reset-request">
    <h1>Reset your password</h1><p className="auth-description">Enter your email and we’ll send you a link.</p>
    <AuthAlert message={message} />
    <form className="auth-form auth-form-spaced" noValidate aria-busy={isSubmitting} onSubmit={event => { void handleSubmit(submit)(event) }}>
      <fieldset className="auth-fields" disabled={isSubmitting}><AuthField label="Email" type="email" placeholder="you@example.com" autoComplete="email" icon={<Mail />} {...register('email', emailRules)} error={errors.email?.message} /></fieldset>
      <AuthSubmit busy={isSubmitting} busyText="Sending reset link…">Send reset link</AuthSubmit>
    </form><BackLink to="/login" />
  </section></AuthPageLayout>
}
