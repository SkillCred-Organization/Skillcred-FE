import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import AuthPageLayout from './AuthPageLayout'
import { useAuth } from '../../features/auth/authContext'
export default function AccountStatusPage() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <AuthPageLayout><section className="auth-panel auth-status">
    <div className="auth-status-icon"><Mail aria-hidden="true" /></div>
    <h1>{user?.needsInstitution ? 'Institution details needed' : 'Pending review'}</h1>
    <p className="auth-description">{user?.needsInstitution ? 'Your account needs an institution before you can verify learner claims. Contact our team for help completing your institution setup.' : 'Your institution is awaiting approval. We’ll email you when you can start verifying learner claims.'}</p>
    <a className="auth-submit inline-flex items-center justify-center rounded-full bg-brand text-white" href="mailto:hello@skillcred.app">Contact SkillCred</a>
    <Link className="auth-back auth-link" to="/login">Back to log in</Link>
  </section></AuthPageLayout>
}
