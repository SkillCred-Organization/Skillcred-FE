import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import AuthPageLayout from './AuthPageLayout'
export default function PasswordUpdatedPage() {
  return <AuthPageLayout><section className="auth-panel auth-status">
    <div className="auth-status-icon"><Check aria-hidden="true" /></div><h1>Password updated</h1>
    <p className="auth-description">Log in with your new password. You’ve been logged out on other devices.</p>
    <Link className="auth-submit inline-flex items-center justify-center rounded-full bg-brand text-white" to="/login">Log in</Link>
  </section></AuthPageLayout>
}
