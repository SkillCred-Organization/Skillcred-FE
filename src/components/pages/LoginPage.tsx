import { Link } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AuthPageLayout from './AuthPageLayout'

export default function LoginPage() {
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(
      'Login is not connected yet. Connect this form to your authentication service.',
    )
  }

  return (
    <AuthPageLayout>
      <section className="w-full max-w-[450px] rounded-xl border border-[#f3e1d6] bg-white p-6 shadow-[0_8px_24px_rgba(69,38,20,0.08)] sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome back
        </h1>

        <p className="mt-1 text-sm text-ink-muted">
          Log in to your SkillCred account.
        </p>

        <button
          type="button"
          onClick={() => setMessage('Google sign-in is not connected yet.')}
          className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#d6c5b7] text-sm font-medium text-ink hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-deep"
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

        <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            placeholder="Enter your password"
            icon={<LockKeyhole className="size-4" />}
            required
          />

          <div className="text-right">
            <button
              type="button"
              onClick={() => setMessage('Password reset is not connected yet.')}
              className="text-xs text-brand underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>

        {message && (
          <p role="status" className="mt-4 text-sm text-ink-muted">
            {message}
          </p>
        )}

        <p className="mt-5 text-center text-sm text-ink-muted">
          New to SkillCred?{' '}
          <Link
            to="/user-type"
            className="font-medium text-brand underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </section>
    </AuthPageLayout>
  )
}