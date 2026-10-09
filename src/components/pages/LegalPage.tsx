import AuthPageLayout from './AuthPageLayout'
import { BackLink } from './AuthControls'
export default function LegalPage({ privacy = false }: { privacy?: boolean }) {
  return <AuthPageLayout><section className="auth-panel">
    <h1>{privacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
    <p className="auth-description">This document has not been published here yet. Please contact <a className="auth-link" href="mailto:hello@skillcred.app">hello@skillcred.app</a> to request a copy before creating an account.</p>
    <BackLink to="/signup">Back to sign up</BackLink>
  </section></AuthPageLayout>
}
