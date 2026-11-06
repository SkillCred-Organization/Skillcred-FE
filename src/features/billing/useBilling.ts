import { createContext, useContext } from 'react'
import type { BillingMe } from '../../lib/billing'

export type BillingState = { billing: BillingMe | null; status: 'loading' | 'ready' | 'error' }
export const BillingContext = createContext<(BillingState & { reload: () => Promise<void> }) | null>(null)

// All learner screens share the refreshed plan and usage after a payment or project change.
export function useBilling() {
  const context = useContext(BillingContext)
  if (!context) throw new Error('BillingProvider is missing')
  return context
}
