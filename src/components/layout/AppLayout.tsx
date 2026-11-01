import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import MobileTabBar from './MobileTabBar'
import Sidebar from './Sidebar'
import { useOnboardingGate } from '../../features/onboarding/useOnboardingGate'
import { useAuth } from '../../features/auth/authContext'
import VerifyEmailRequired from '../../features/auth/VerifyEmailRequired'

// Page names used in the "Verify your email to use ..." message
const pageNames: Record<string, string> = {
  dashboard: 'your dashboard', projects: 'Projects', certifications: 'Certifications', skills: 'Skills',
  achievements: 'Achievements', verification: 'Verification', share: 'Share profile', settings: 'Settings',
  profile: 'your profile', billing: 'Billing',
}


export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = useLocation().pathname
  const settings = pathname === '/app/settings'
  const { user } = useAuth()
  const unverified = user?.role === 'learner' && !user.emailVerified // every learner API answers 403 until then

  const checking = useOnboardingGate()

  if (checking) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-page text-sm text-ink-muted">
        Loading your account…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className={`min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8 ${settings ? 'learner-settings-main' : ''}`}>
        {unverified ? <VerifyEmailRequired page={pageNames[pathname.split('/')[2]] ?? 'this page'} /> : <Outlet />}
      </main>
      {!settings && <MobileTabBar />}
    </div>
  )
}
