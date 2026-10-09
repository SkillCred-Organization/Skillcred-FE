import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, GraduationCap } from 'lucide-react'
import Button from '../ui/Button'
import AuthPageLayout from './AuthPageLayout'

export default function UserTypePage() {
  const [userType, setUserType] = useState<'learner' | 'institution'>('learner')
  const navigate = useNavigate()

  return (
    <AuthPageLayout>
      <section className="w-full max-w-[450px] rounded-xl border border-[#f3e1d6] bg-white p-6 shadow-[0_8px_24px_rgba(69,38,20,0.08)] sm:p-8">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Which user are you?</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">Choose the account type that fits you.</p>

        <fieldset className="mt-6 grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Choose your account type</legend>
          <label
            className={`flex min-h-36 cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
              userType === 'learner'
                ? 'border-[#64a51c] ring-1 ring-[#64a51c]'
                : 'border-[#f3e1d6] hover:bg-cream'
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="userType"
              value="learner"
              checked={userType === 'learner'}
              onChange={() => setUserType('learner')}
            />
            <span className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-md bg-[#fff0e5] text-brand">
                <GraduationCap className="size-4" aria-hidden="true" />
              </span>
              <span className={`size-3 rounded-full border ${userType === 'learner' ? 'border-[#4b8d0b] bg-[#4b8d0b] ring-2 ring-[#d7f0c4]' : 'border-[#cdbbae]'}`} />
            </span>
            <span className="mt-3 text-sm font-semibold text-ink">I&apos;m a learner or graduate</span>
            <span className="mt-1 text-xs leading-5 text-ink-muted">
              Add your projects, certifications and skills, and get them verified by your institution.
            </span>
          </label>

          <label
            className={`flex min-h-36 cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
              userType === 'institution'
                ? 'border-[#64a51c] ring-1 ring-[#64a51c]'
                : 'border-[#f3e1d6] hover:bg-cream'
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="userType"
              value="institution"
              checked={userType === 'institution'}
              onChange={() => setUserType('institution')}
            />
            <span className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-md bg-[#f4eae7] text-ink-muted">
                <Building2 className="size-4" aria-hidden="true" />
              </span>
              <span className={`size-3 rounded-full border ${userType === 'institution' ? 'border-[#4b8d0b] bg-[#4b8d0b] ring-2 ring-[#d7f0c4]' : 'border-[#cdbbae]'}`} />
            </span>
            <span className="mt-3 text-sm font-semibold text-ink">I represent an institution</span>
            <span className="mt-1 text-xs leading-5 text-ink-muted">
              Review and verify the work your learners add to SkillCred.
            </span>
          </label>
        </fieldset>

        <Button
          className="mt-4 w-full"
          onClick={() => navigate(userType === 'learner' ? '/signup' : '/institution-signup')}
        >
          Continue
        </Button>
        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand underline underline-offset-2">Log in</Link>
        </p>
      </section>
    </AuthPageLayout>
  )
}