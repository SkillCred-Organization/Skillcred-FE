import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Globe2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AuthPageLayout from './AuthPageLayout'

export default function InstitutionSignupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [message, setMessage] = useState('')
  const [institutionDetails, setInstitutionDetails] = useState({
    institutionName: '',
    website: '',
    registrationNumber: '',
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 1) {
      const formData = new FormData(event.currentTarget)
      setInstitutionDetails({
        institutionName: String(formData.get('institutionName') ?? ''),
        website: String(formData.get('website') ?? ''),
        registrationNumber: String(formData.get('registrationNumber') ?? ''),
      })
      setStep(2)
      setMessage('')
      return
    }
    setMessage('Your institution registration is not connected yet. Connect this form to your registration service.')
  }

  return (
    <AuthPageLayout>
      <section className="w-full max-w-[490px] rounded-xl border border-[#f3e1d6] bg-white p-6 shadow-[0_8px_24px_rgba(69,38,20,0.08)] sm:p-8">
        <p className="text-xs text-ink-muted">Step {step} of 2 · {step === 1 ? 'Institution' : 'Your account'}</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#f4eae7]">
          <div className={`h-full rounded-full bg-[#4b8d0b] transition-all ${step === 1 ? 'w-1/2' : 'w-full'}`} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
          {step === 1 ? 'Register your institution' : 'Create your admin account'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {step === 1
            ? 'We check these details before you can verify claims. It usually takes a few hours.'
            : 'You’ll review claims for your institution. Use your work email on the institution’s domain.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <Input
                label="Institution name"
                name="institutionName"
                autoComplete="organization"
                placeholder="e.g. Lagos Tech Institute"
                icon={<Building2 className="size-4" />}
                value={institutionDetails.institutionName}
                onChange={(event) => setInstitutionDetails({ ...institutionDetails, institutionName: event.target.value })}
                required
              />
              <Input
                label="Website"
                name="website"
                type="url"
                autoComplete="url"
                placeholder="https://"
                helperText="Your work email must use this domain."
                icon={<Globe2 className="size-4" />}
                value={institutionDetails.website}
                onChange={(event) => setInstitutionDetails({ ...institutionDetails, website: event.target.value })}
                required
              />
              <Input
                label="Registration number (optional)"
                name="registrationNumber"
                placeholder="e.g. CAC number"
                value={institutionDetails.registrationNumber}
                onChange={(event) => setInstitutionDetails({ ...institutionDetails, registrationNumber: event.target.value })}
              />
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Your name"
                  name="administratorName"
                  autoComplete="name"
                  placeholder="Your full name"
                  icon={<UserRound className="size-4" />}
                  required
                />
                <Input
                  label="Job title"
                  name="jobTitle"
                  autoComplete="organization-title"
                  placeholder="e.g. Programme lead"
                  required
                />
              </div>
              <Input
                label="Work email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@institution.edu"
                icon={<Mail className="size-4" />}
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                helperText="At least 8 characters."
                minLength={8}
                icon={<LockKeyhole className="size-4" />}
                required
              />
              <label className="flex items-start gap-2 text-sm text-ink">
                <input className="mt-1 size-4 accent-[#4b8d0b]" type="checkbox" name="authorised" required />
                <span>I&apos;m authorised to verify learner claims for this institution.</span>
              </label>
            </>
          )}

          <Button type="submit" className="w-full">
            {step === 1 ? 'Continue' : 'Submit for review'}
          </Button>
        </form>

        {message && <p role="status" className="mt-4 text-sm text-ink-muted">{message}</p>}
        {step === 1 ? (
          <Link to="/user-type" className="mx-auto mt-4 flex w-fit items-center gap-1 text-sm text-ink-muted hover:text-brand">
            <ArrowLeft className="size-3" /> Back
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => { setStep(1); setMessage('') }}
            className="mx-auto mt-4 flex items-center gap-1 text-sm text-ink-muted hover:text-brand"
          >
            <ArrowLeft className="size-3" /> Back
          </button>
        )}
      </section>
    </AuthPageLayout>
  )
}