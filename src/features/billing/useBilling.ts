import { useCallback, useEffect, useState } from 'react'
import { getBilling } from '../../lib/billing'
import type { BillingMe } from '../../lib/billing'
import { useAuth } from '../auth/authContext'

type Status = 'loading' | 'ready' | 'error'

// Loads the learner's plan and project usage. Admins are never asked (billing calls return 403 for them).
export function useBilling() {
  const { user } = useAuth()
  const isLearner = user?.role === 'learner'
  const [billing, setBilling] = useState<BillingMe | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isLearner) return
    let cancelled = false
    getBilling()
      .then((b) => {
        if (cancelled) return
        setBilling(b)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [isLearner, attempt])

  const reload = useCallback(() => {
    setStatus('loading')
    setAttempt((a) => a + 1)
  }, [])

  return { billing, status, reload }
}