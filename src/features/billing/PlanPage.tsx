import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, TriangleAlert, Star, ShieldCheck } from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import InlineAlert from '../../components/ui/InlineAlert'
import Skeleton from '../../components/ui/Skeleton'
import { formatNaira, getPlans } from '../../lib/billing'
import type { Plan } from '../../lib/billing'
import { useAuth } from '../auth/authContext'
import UpgradeButton from './UpgradeButton'
import { useBilling } from './useBilling'

export default function PlanPage() {
  const { user } = useAuth()
  const { billing, status, reload } = useBilling()
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [plansFailed, setPlansFailed] = useState(false)
  const [plansAttempt, setPlansAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getPlans()
      .then((r) => {
        if (!cancelled) setPlans(r.plans)
      })
      .catch(() => {
        if (!cancelled) setPlansFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [plansAttempt])

  if (user?.role === 'admin') {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState icon={TriangleAlert} title="Billing is for learners" message="Institution accounts don't have a plan." />
      </div>
    )
  }

  const premiumPlan = plans?.find((p) => p.id === 'premium')
  const freePlan = plans?.find((p) => p.id === 'free')
  const freeLimit = freePlan?.projectLimit ?? 2
  const rows: [string, string, string][] = [
    ['Price', freePlan ? formatNaira(freePlan.priceNgn) : '', premiumPlan ? `${formatNaira(premiumPlan.priceNgn)} once` : ''],
    ['Projects', `Up to ${freeLimit}`, 'Unlimited'],
    ['Public profile and link', '✓', '✓'],
    ['Submit for verification', '✓', '✓ Same review'],
    ['Existing projects', 'Kept', 'Kept'],
  ]
  const benefits = [
    'Lifetime Premium access with unlimited projects.',
    'Keep your existing projects and public profile.',
    'Share your profile with employers.',
    'Submit projects for institutional verification under the same review process.',
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pending-bg px-3 py-1 text-xs text-pending-text">
          <Star className="size-3" />
          Premium Plan
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Showcase more of your work.</h1>
        <p className="text-sm text-ink-muted">
          Pay once for lifetime Premium access and unlimited projects to showcase your skills and experience.
        </p>
      </header>

      {status === 'error' || plansFailed ? (
        <EmptyState
          icon={TriangleAlert}
          title="Something went wrong"
          message="It's on our side. Please try again in a moment."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setPlansFailed(false)
                setPlans(null)
                setPlansAttempt((a) => a + 1)
                reload()
              }}
            >
              Retry
            </Button>
          }
        />
      ) : status === 'loading' || !billing || !plans ? (
        <div role="status" aria-label="Loading plans" className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {!billing.billingEnabled && (
            <InlineAlert variant="info" title="Payments aren't switched on yet">
              Upgrades are unavailable right now. You can keep using your current plan.
            </InlineAlert>
          )}

          {billing.plan === 'premium' && (
            <InlineAlert variant="success" title="Your lifetime Premium is active">
              You have unlimited projects with no recurring charges.
            </InlineAlert>
          )}

          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_20rem] lg:items-start">
            <div className="contents lg:block lg:space-y-4">
              <section className="order-2 rounded-xl border border-line bg-white p-5">
                <h2 className="text-base font-semibold text-ink">What you get</h2>
                <ul className="mt-3 space-y-2 text-sm text-ink">
                  {benefits.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent-dark" />
                      {t}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="order-3 rounded-xl border border-line bg-white p-5">
                <h2 className="text-base font-semibold text-ink">Free vs Premium</h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm text-ink">
                    <thead>
                      <tr>
                        <th className="pb-2" />
                        <th className="pb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Free</th>
                        <th className="pb-2 text-xs font-medium uppercase tracking-wide text-brand">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(([label, free, premium]) => (
                        <tr key={label} className="border-t border-line">
                          <td className="py-2.5 pr-3">{label}</td>
                          <td className="py-2.5 pr-3 text-ink-muted">{free}</td>
                          <td className="py-2.5">{premium}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="contents lg:block lg:space-y-4">
              <section className="order-1 rounded-xl border border-line bg-white p-5">
                <p className="text-sm text-ink">Premium</p>
                <p className="mt-2 text-3xl font-semibold text-ink">
                  {premiumPlan ? formatNaira(premiumPlan.priceNgn) : ''}
                  <span className="mt-1 block text-base font-normal text-ink-muted">One-time payment · Lifetime access</span>
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Pay once by card through Paystack. No recurring charges.
                </p>
                {billing.plan === 'premium' ? (
                  <div className="mt-4 space-y-2">
                    <p className="rounded-full bg-verified-bg px-3 py-2.5 text-center text-sm font-medium text-verified-text">
                      Your plan
                    </p>
                    <p className="text-center text-sm text-ink">Lifetime access is active.</p>
                  </div>
                ) : (
                  billing.canUpgrade &&
                  billing.billingEnabled && (
                    <div className="mt-4">
                      <UpgradeButton label="Proceed to Payment" className="w-full" />
                    </div>
                  )
                )}
                <Link to="/app/projects" className="mt-3 block py-2 text-center text-sm font-medium text-brand">
                  Back to My Projects
                </Link>
              </section>

              <div className="order-4 flex items-start gap-2 rounded-xl bg-pending-bg p-4 text-sm text-ink">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pending-text" />
                <p>Premium never verifies a project. Your institution still reviews every request, on every plan.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
