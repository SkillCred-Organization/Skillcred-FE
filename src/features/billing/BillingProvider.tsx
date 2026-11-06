import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { tokenStore } from '../../lib/apiClient'
import { getBilling } from '../../lib/billing'
import { useAuth } from '../auth/authContext'
import { BillingContext, type BillingState } from './useBilling'

function LearnerBilling({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [state, setState] = useState<BillingState>({ billing: null, status: 'loading' })
  const sequence = useRef(0)

  const refresh = useCallback(() => {
    if (!enabled) return Promise.resolve()
    const request = ++sequence.current
    return getBilling().then(
      billing => { if (request === sequence.current) setState({ billing, status: 'ready' }) },
      () => { if (request === sequence.current) setState(previous => ({ ...previous, status: 'error' })) },
    )
  }, [enabled])

  useEffect(() => {
    void refresh()
    // A request from the previous session or before payment must not overwrite newer data.
    return () => { sequence.current += 1 }
  }, [refresh])

  const reload = useCallback(() => {
    setState(previous => ({ ...previous, status: 'loading' }))
    return refresh()
  }, [refresh])

  return <BillingContext.Provider value={{ ...state, reload }}>{children}</BillingContext.Provider>
}

export default function BillingProvider({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth()
  const learner = user?.role === 'learner'
  // Remount on account/session changes so another learner never inherits this plan.
  const session = learner ? `${user.id}:${tokenStore.get()}` : 'signed-out-or-admin'
  return <LearnerBilling key={session} enabled={learner && user.emailVerified && !loading && !error}>{children}</LearnerBilling>
}
