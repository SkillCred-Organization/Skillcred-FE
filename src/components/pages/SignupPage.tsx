import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import AuthPageLayout from './AuthPageLayout'
import GoogleAuthButton from './GoogleAuthButton'
import { Agreement, AuthAlert, AuthDivider, AuthField, AuthSubmit, TermsText } from './AuthControls'
import { authApi, authDestination, type LearnerRegistration } from '../../lib/auth'
import { applyFieldErrors, emailRules, nameRules, passwordRules } from '../../lib/authForm'
import { useAuth } from '../../features/auth/authContext'

export default function SignupPage() {
  const { register, control, handleSubmit, setError, clearErrors, trigger, getValues, formState: { errors, isSubmitting } } = useForm<LearnerRegistration>({ defaultValues: { fullName: '', email: '', password: '', acceptedTerms: false } })
  const acceptedTerms = useWatch({ control, name: 'acceptedTerms' })
  const [message, setMessage] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const { acceptSession } = useAuth()
  const navigate = useNavigate()
  function failure(error: unknown) {
    const apiError = applyFieldErrors(error, setError, ['fullName', 'email', 'password', 'acceptedTerms'])
    setMessage(error instanceof Error ? error.message : apiError.message)
  }
  async function submit(values: LearnerRegistration) {
    setMessage('')
    try {
      const response = await authApi.registerLearner({ ...values, fullName: values.fullName.trim() })
      navigate(authDestination(acceptSession(response), 'signup'), { replace: true })
    } catch (error) { failure(error) }
  }
  return <AuthPageLayout><section className="auth-panel auth-signup">
    <h1>Create your account</h1><p className="auth-description">It takes about 2 minutes.</p>
    <div className="auth-role"><GraduationCap aria-hidden="true" /><span>Signing up as a <strong>learner</strong></span><Link className="auth-link" to="/user-type">Change</Link></div>
    <AuthAlert message={message} focusOnShow />
    <GoogleAuthButton label="Continue with Google" disabled={isSubmitting} onBusyChange={setGoogleBusy} requiresConsent={!acceptedTerms} onConsentRequired={() => { void trigger('acceptedTerms', { shouldFocus: true }) }} onError={failure} onCredential={async credential => {
      setMessage('')
      const response = await authApi.google({ credential, role: 'learner', acceptedTerms: getValues('acceptedTerms') })
      navigate(authDestination(acceptSession(response), 'signup'), { replace: true })
    }} />
    <AuthDivider />
    <form className="auth-form" noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(submit)}>
      <fieldset className="auth-fields" disabled={isSubmitting || googleBusy}>
        <AuthField label="Full name" placeholder="e.g. Adaeze Okafor" autoComplete="name" icon={<UserRound />} {...register('fullName', nameRules)} error={errors.fullName?.message} />
        <AuthField label="Email" type="email" placeholder="you@example.com" autoComplete="email" icon={<Mail />} {...register('email', emailRules)} error={errors.email?.message} />
        <AuthField label="Password" type="password" placeholder="Create a password" autoComplete="new-password" icon={<LockKeyhole />} helperText="At least 8 characters, with a number" {...register('password', passwordRules)} error={errors.password?.message} />
      </fieldset>
      <Controller name="acceptedTerms" control={control} rules={{ validate: value => value === true || 'Accept the Terms and Privacy Policy to continue.' }} render={({ field }) => (
        <Agreement name={field.name} ref={field.ref} checked={field.value} onBlur={field.onBlur}
          onChange={event => { field.onChange(event.target.checked); if (event.target.checked) clearErrors('acceptedTerms') }}
          disabled={isSubmitting || googleBusy} error={errors.acceptedTerms?.message}><TermsText /></Agreement>
      )} />
      <AuthSubmit busy={isSubmitting || googleBusy} busyText={googleBusy ? 'Connecting to Google…' : 'Creating account…'}>Create account</AuthSubmit>
    </form>
    <p className="auth-footer">Already have an account? <Link className="auth-link" to="/login">Log in</Link></p>
  </section></AuthPageLayout>
}
