import { useEffect, useState } from 'react'
import { getPlans } from '../../lib/billing'
import type { Plan } from '../../lib/billing'

export function usePremiumPlan() {
  const [premium, setPremium] = useState<Plan | null>(null)
  useEffect(() => {
    let cancelled = false
    getPlans()
      .then((r) => {
        if (!cancelled) setPremium(r.plans.find((p) => p.projectLimit === null) ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return { premium }
}