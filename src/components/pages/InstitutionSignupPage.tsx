import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ChevronLeft, Link as LinkIcon, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import AuthPageLayout from './AuthPageLayout'
import { Agreement, AuthAlert, AuthField, AuthSubmit, BackLink } from './AuthControls'
import { authApi, emailMatchesWebsite, websiteDomain, type AdminRegistration } from '../../lib/auth'
import { applyFieldErrors, emailRules, nameRules } from '../../lib/authForm'
import { useAuth } from '../../features/auth/authContext'

const institutionFields = ['institutionName', 'website', 'registrationNumber'] as const
const allFields = [...institutionFields, 'fullName', 'jobTitle', 'email', 'password', 'authorised'] as const
export default function InstitutionSignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [message, setMessage] = useState('')
  const { register, control, trigger, handleSubmit, getValues, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<AdminRegistration>({
    shouldUnregister: false,
    defaultValues: { institutionName: '', website: '', registrationNumber: '', fullName: '', jobTitle: '', email: '', password: '', authorised: false },
  })
  const navigate = useNavigate()
  const { acceptSession } = useAuth()
  async function submit(values: AdminRegistration) {
    setMessage('')
    try {
      const response = await authApi.registerAdmin({
        ...values, institutionName: values.institutionName.trim(), fullName: values.fullName.trim(),
        jobTitle: values.jobTitle.trim(), website: values.website.trim(),
        registrationNumber: values.registrationNumber?.trim() || undefined,
      })
      acceptSession(response)
      navigate('/verify-email', { replace: true, state: { email: values.email, institutionName: values.institutionName } })
    } catch (error) {
      const apiError = applyFieldErrors(error, setError, allFields)
      setMessage(apiError.message)
      if (apiError.code === 'FREE_EMAIL') setError('email', { type: 'server', message: 'Use your institutional work email, rather than a personal email address.' }, { shouldFocus: true })
      if (apiError.code === 'DOMAIN_MISMATCH') setError('email', { type: 'server', message: 'Your work email must use your institution’s website domain.' }, { shouldFocus: true })
      if (apiError.code === 'INSTITUTION_EXISTS') {
        setError('website', { type: 'server', message: 'This institution is already registered. Contact its existing account owner.' })
        setStep(1)
      } else if (institutionFields.some(field => apiError.fieldErrors?.[field]?.length)) setStep(1)
    }
  }
  return <AuthPageLayout><section className="auth-panel auth-institution">
    <div className="auth-step">
      <p className="auth-step-label">Step {step} of 2<span className="auth-step-detail"> · {step === 1 ? 'Institution' : 'Your account'}</span></p>
      <div className="auth-progress" aria-hidden="true"><span className="is-complete" /><span className={step === 2 ? 'is-complete' : ''} /></div>
    </div>
    <h1>{step === 1 ? 'Register your institution' : <><span className="auth-desktop-copy">Create your admin account</span><span className="auth-mobile-copy">Register your institution</span></>}</h1>
    <p className="auth-description">{step === 1 ? 'We check these details before you can verify claims. It usually takes few hours.' : <>
      <span className="auth-desktop-copy">You’ll review claims for {getValues('institutionName') || 'your institution'}. Use your work email on the institution’s domain.</span>
      <span className="auth-mobile-copy">We check these details before you can verify claims. It usually takes few hours.</span>
    </>}</p>
    <AuthAlert message={message} />
    <form className="auth-form auth-form-spaced" noValidate aria-busy={isSubmitting} onSubmit={event => {
      if (step === 1) {
        event.preventDefault()
        void trigger([...institutionFields], { shouldFocus: true }).then(valid => { if (valid) { setStep(2); setMessage('') } })
      } else void handleSubmit(submit, invalid => { if (institutionFields.some(field => invalid[field])) setStep(1) })(event)
    }}>
      <fieldset className="auth-fields" disabled={isSubmitting}>
        {step === 1 ? <>
          <AuthField label="Institution name" placeholder="e.g. Lagos Tech Institute" autoComplete="organization" icon={<Building2 />} {...register('institutionName', { required: 'Enter your institution’s name', validate: value => !!value.trim() || 'Enter your institution’s name' })} error={errors.institutionName?.message} />
          <AuthField label="Website" type="url" placeholder="https://" autoComplete="url" helperText="Your work email must use this domain." icon={<LinkIcon />} {...register('website', { required: 'Enter your institution’s website', setValueAs: value => value.trim(), validate: value => !!websiteDomain(value) || 'Enter a valid website, including https://' })} error={errors.website?.message} />
          <AuthField label="Registration number (optional)" placeholder="e.g. CAC number" {...register('registrationNumber')} error={errors.registrationNumber?.message} />
        </> : <>
          <div className="auth-person-row">
            <AuthField label="Your name" placeholder="Your full name" autoComplete="name" icon={<UserRound />} {...register('fullName', nameRules)} error={errors.fullName?.message} />
            <AuthField label="Job title" placeholder="e.g. Programme lead" autoComplete="organization-title" {...register('jobTitle', { required: 'Enter your job title', validate: value => !!value.trim() || 'Enter your job title' })} error={errors.jobTitle?.message} />
          </div>
          <AuthField label="Work email" type="email" placeholder="you@institution.edu" autoComplete="email" icon={<Mail />} {...register('email', { ...emailRules, validate: value => emailMatchesWebsite(value, getValues('website')) || 'Your work email must use your institution’s website domain.' })} error={errors.email?.message} />
          <AuthField label="Password" type="password" placeholder="Create a password" autoComplete="new-password" helperText="At least 8 characters" icon={<LockKeyhole />} {...register('password', { required: 'Create a password', minLength: { value: 8, message: 'Use at least 8 characters' } })} error={errors.password?.message} />
        </>}
      </fieldset>
      {step === 2 && <Controller name="authorised" control={control} rules={{ validate: value => value === true || 'Confirm you are authorised to verify claims for this institution.' }} render={({ field }) => (
        <Agreement name={field.name} ref={field.ref} checked={field.value} onBlur={field.onBlur}
          onChange={event => { field.onChange(event.target.checked); if (event.target.checked) clearErrors('authorised') }}
          disabled={isSubmitting} error={errors.authorised?.message}>I’m authorised to verify learner claims for this institution.</Agreement>
      )} />}
      <AuthSubmit busy={isSubmitting} busyText="Submitting…">{step === 1 ? 'Continue' : 'Submit for review'}</AuthSubmit>
    </form>
    {step === 1 ? <BackLink to="/user-type">Back</BackLink> : <button type="button" className="auth-back" disabled={isSubmitting} onClick={() => { setStep(1); setMessage('') }}><ChevronLeft aria-hidden="true" />Back</button>}
  </section></AuthPageLayout>
}
