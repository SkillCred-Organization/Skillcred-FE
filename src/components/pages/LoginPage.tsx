import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import AuthPageLayout from './AuthPageLayout'
import GoogleAuthButton from './GoogleAuthButton'
import { Agreement, AuthAlert, AuthDivider, AuthField, AuthSubmit, TermsText } from './AuthControls'
import { authApi, authDestination, type AuthResponse, type AuthUser } from '../../lib/auth'
import { ApiError } from '../../lib/apiClient'
import { applyFieldErrors, emailRules } from '../../lib/authForm'
import { useAuth } from '../../features/auth/authContext'

type LoginValues = { email: string; password: string }
export default function LoginPage() {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginValues>()
  const [message, setMessage] = useState('')
  const [invalidCredentials, setInvalidCredentials] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [googleCredential, setGoogleCredential] = useState('')
  const [role, setRole] = useState<AuthUser['role']>('learner')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [setupBusy, setSetupBusy] = useState(false)
  const { acceptSession } = useAuth()
  const navigate = useNavigate()
  function success(response: AuthResponse, flow: 'login' | 'signup' = 'login') {
    navigate(authDestination(acceptSession(response), flow), { replace: true })
  }
  function failure(error: unknown, method: 'password' | 'google' = 'password') {
    const apiError = applyFieldErrors(error, setError, ['email', 'password'])
    const invalid = method === 'password' && apiError.status === 401 && !apiError.code?.startsWith('GOOGLE')
    setInvalidCredentials(invalid)
    if (invalid) {
      setMessage('That email and password don’t match.')
      setError('password', { type: 'server', message: 'Incorrect password' }, { shouldFocus: true })
    } else setMessage(error instanceof Error ? error.message : apiError.message)
  }
  async function submit(values: LoginValues) {
    setMessage(''); setInvalidCredentials(false)
    try { success(await authApi.login(values)) } catch (error) { failure(error) }
  }
  async function googleSignIn(credential: string) {
    setMessage(''); setInvalidCredentials(false)
    try { success(await authApi.google({ credential })) }
    catch (error) {
      if (error instanceof ApiError && ['ROLE_REQUIRED', 'TERMS_REQUIRED'].includes(error.code ?? '')) setGoogleCredential(credential)
      else throw error
    }
  }
  async function completeGoogle() {
    if (!acceptedTerms) { setMessage('Accept the Terms and Privacy Policy to continue.'); return }
    setSetupBusy(true); setMessage('')
    try { success(await authApi.google({ credential: googleCredential, role, acceptedTerms }), 'signup') }
    catch (error) { failure(error, 'google') }
    finally { setSetupBusy(false) }
  }
  return <AuthPageLayout><section className={`auth-panel auth-login ${message ? 'has-error' : ''}`}>
    <h1>{googleCredential ? 'Complete your account' : 'Welcome back'}</h1>
    <p className="auth-description">{googleCredential ? 'Choose the account that fits you.' : 'Log in to your SkillCred account.'}</p>
    <AuthAlert message={message} detail={invalidCredentials ? 'Try again or reset your password.' : undefined} />
    {googleCredential ? <form className="auth-google-setup" onSubmit={e => { e.preventDefault(); void completeGoogle() }}>
      <fieldset className="auth-fields" disabled={setupBusy}><legend className="sr-only">Account type</legend>
        <label className="auth-choice-card"><input type="radio" name="googleRole" checked={role === 'learner'} onChange={() => setRole('learner')} /><span className="auth-choice-title">I’m a learner or graduate</span></label>
        <label className="auth-choice-card"><input type="radio" name="googleRole" checked={role === 'admin'} onChange={() => setRole('admin')} /><span className="auth-choice-title">I represent an institution</span></label>
      </fieldset>
      <Agreement checked={acceptedTerms} disabled={setupBusy} onChange={e => { setAcceptedTerms(e.target.checked); if (e.target.checked) setMessage('') }}><TermsText /></Agreement>
      <AuthSubmit busy={setupBusy} busyText="Creating account…">Create account</AuthSubmit>
    </form> : <>
      <GoogleAuthButton label="Log in with Google" disabled={isSubmitting} onBusyChange={setGoogleBusy} onCredential={googleSignIn} onError={error => failure(error, 'google')} />
      {!message && <AuthDivider />}
      <form className="auth-form" noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(submit)}>
        <fieldset className="auth-fields" disabled={isSubmitting || googleBusy}>
          <AuthField label="Email" type="email" autoComplete="email" placeholder="you@example.com" icon={<Mail />} {...register('email', emailRules)} error={errors.email?.message} />
          <AuthField label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" icon={<LockKeyhole />} {...register('password', { required: 'Enter your password' })} error={errors.password?.message} />
        </fieldset>
        <p className="auth-forgot"><Link className="auth-link" to="/forgot-password">Forgot password?</Link></p>
        <AuthSubmit busy={isSubmitting || googleBusy} busyText={googleBusy ? 'Connecting to Google…' : 'Logging in…'}>Log in</AuthSubmit>
      </form>
    </>}
    <p className="auth-footer">New to SkillCred? <Link className="auth-link" to="/user-type">Create an account</Link></p>
  </section></AuthPageLayout>
}
