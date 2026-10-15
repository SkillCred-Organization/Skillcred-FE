import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import MobileTabBar from './MobileTabBar'
import Sidebar from './Sidebar'
import { useOnboardingGate } from '../../features/onboarding/useOnboardingGate'


export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const settings = useLocation().pathname === '/app/settings'

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
        <Outlet />
      </main>
      {!settings && <MobileTabBar />}
    </div>
  )
}
