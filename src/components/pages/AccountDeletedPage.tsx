import { Link } from 'react-router-dom'
import AuthPageLayout from './AuthPageLayout'

export default function AccountDeletedPage() {
  return (
    <AuthPageLayout>
      <section className="auth-panel auth-status">
        <h1>Your account has been deleted</h1>
        <p className="auth-description">
          Your profile, projects and verifications have been removed. You&apos;re welcome to sign up again any time
          with the same email.
        </p>
        <Link className="auth-back auth-link" to="/">
          Back to home
        </Link>
      </section>
    </AuthPageLayout>
  )
}