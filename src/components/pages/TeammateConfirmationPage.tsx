import { Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthPageLayout from './AuthPageLayout'
export default function TeammateConfirmationPage() {
  return <AuthPageLayout><section className="auth-panel auth-status"><div className="auth-status-icon"><Users /></div><h1>Teammate confirmation</h1><p className="auth-description">Teammate confirmations aren’t available yet. You don’t need to share your password or login token to confirm someone’s work.</p><p className="auth-description">Contact the person who sent you this link for an update.</p><Link className="workspace-button" to="/">Back to SkillCred</Link></section></AuthPageLayout>
}
