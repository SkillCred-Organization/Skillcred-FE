import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AuthPageLayout from './AuthPageLayout'

export default function SignupPage() {
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Account creation is not connected yet. Connect this form to your authentication service.')
  }

  return (
    <AuthPageLayout>
      <section className="w-full max-w-[450px] rounded-xl border border-[#f3e1d6] bg-white p-6 shadow-[0_8px_24px_rgba(69,38,20,0.08)] sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">It takes about 2 minutes.</p>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f7efeb] px-3 py-2 text-xs text-ink-muted">
          <span>Signing up as a learner</span>
          <Link to="/user-type" className="font-medium text-brand underline underline-offset-2">Change</Link>
        </div>
        <button
          type="button"
          onClick={() => setMessage('Google sign-up is not connected yet.')}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#d6c5b7] text-sm font-medium text-ink hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-deep"
        >
          <img
            src="/google.png"
            alt="Google"
            width={20}
            height={20}
            className="block"
          />
          Continue with Google
        </button>
        <div className="my-4 flex items-center gap-3 text-xs text-ink-muted">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="e.g. Adaeze Okafor"
            icon={<UserRound className="size-4" />}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={<Mail className="size-4" />}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            helperText="At least 8 characters, with a number."
            minLength={8}
            pattern="(?=.*[0-9]).{8,}"
            title="Use at least 8 characters and include a number."
            icon={<LockKeyhole className="size-4" />}
            required
          />
          <label className="flex items-start gap-2 text-xs leading-5 text-ink-muted">
            <input
              className="mt-1 size-3.5 accent-[#65361d]"
              type="checkbox"
              name="agreeToTerms"
              required
            />
            <span>
              I agree to the <a href="#terms" className="text-brand underline underline-offset-2">Terms</a>
              {' '}and <a href="#privacy" className="text-brand underline underline-offset-2">Privacy Policy</a>.
            </span>
          </label>
          <Button type="submit" className="w-full">Create account</Button>
        </form>

        {message && <p role="status" className="mt-4 text-sm text-ink-muted">{message}</p>}
        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
        <Link to="/user-type" className="mx-auto mt-4 flex w-fit items-center gap-1 text-xs text-ink-muted hover:text-brand">
          <ArrowLeft className="size-3" /> Back
        </Link>
      </section>
    </AuthPageLayout>
  )
}