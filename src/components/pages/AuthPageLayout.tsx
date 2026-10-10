import type { ReactNode } from 'react'
import Logo from '../Logo'
import '../../auth.css'
export default function AuthPageLayout({ children }: { children: ReactNode }) {
  return <main className="auth-page"><header className="auth-header"><Logo className="auth-logo" /></header><div className="auth-main">{children}</div></main>
}
