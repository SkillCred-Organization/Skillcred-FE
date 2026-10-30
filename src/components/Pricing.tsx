import { Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/authContext'
import { useResource } from '../hooks/useResource'
import { getPlans, type Plan } from '../lib/billing'

async function loadPricing() {
  const data = await getPlans()
  const free = data.plans?.find(plan => plan.id === 'free')
  const premium = data.plans?.find(plan => plan.id === 'premium')
  const valid = (plan?: Plan) => plan && Number.isFinite(plan.priceNgn) && plan.priceNgn >= 0
    && (plan.projectLimit === null || (Number.isInteger(plan.projectLimit) && plan.projectLimit >= 0))
  if (!valid(free) || !valid(premium) || !/^[A-Z]{3}$/.test(data.currency)) throw new Error('Plan details are unavailable.')
  return { ...data, free: free!, premium: premium! }
}

const intervalLabel = (interval: string) => ({ monthly: 'month', yearly: 'year', annually: 'year' })[interval] || interval
const limitLabel = (limit: number | null) => limit === null ? 'Unlimited projects' : `Up to ${limit} ${limit === 1 ? 'project' : 'projects'}`

export default function Pricing() {
  const { data, loading, error, reload } = useResource(loadPricing)
  const { user } = useAuth()
  const price = (amount: number) => new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: data!.currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
  return <section id="pricing" className="pricing-section" aria-labelledby="pricing-title" aria-busy={loading}>
    <div className="landing-container pricing-container">
      <header className="pricing-heading"><span className="pricing-label">Pricing for students</span>
        <h2 id="pricing-title">Start free. Upgrade when you need more room.</h2>
        <p>Your institution verifies your work on every plan. Paying never changes how a project is reviewed.</p>
      </header>
      {loading && <div className="pricing-cards pricing-loading" role="status" aria-label="Loading plans"><div /><div /><span className="sr-only">Loading plans…</span></div>}
      {error && <div className="pricing-error" role="alert"><p>We couldn’t load the plans. Please try again.</p><button className="landing-button button-outline" onClick={reload}>Try again</button></div>}
      {data && <div className="pricing-cards">
        <article className="pricing-card" aria-labelledby="free-plan-title">
          <h3 id="free-plan-title">{data.free.name}</h3>
          <p className="pricing-price">{price(data.free.priceNgn)}</p>
          <p className="pricing-card-description">Everything you need to start building a verified profile.</p>
          <ul><li><Check aria-hidden="true" />{limitLabel(data.free.projectLimit)}</li><li><Check aria-hidden="true" />Basic public profile</li>
            <li className="pricing-mobile-benefit"><Check aria-hidden="true" />Shareable profile link</li><li className="pricing-mobile-benefit"><Check aria-hidden="true" />Project submission for institutional verification</li></ul>
          <Link className="landing-button button-outline" to="/user-type">Get Started Free</Link>
        </article>
        <article className="pricing-card" aria-labelledby="premium-plan-title">
          <div className="pricing-card-heading"><h3 id="premium-plan-title">{data.premium.name}</h3><span className="pricing-label"><Sparkles size={14} aria-hidden="true" />More room</span></div>
          <p className="pricing-price">{price(data.premium.priceNgn)}<span>/ {intervalLabel(data.premium.interval)}</span></p>
          <p className="pricing-card-description">For students with more work to show.</p>
          <ul><li><Check aria-hidden="true" />{data.premium.projectLimit === null && data.free.projectLimit !== null ? `Add more than ${data.free.projectLimit} projects` : limitLabel(data.premium.projectLimit)}</li>
            <li><Check aria-hidden="true" />Public profile and shareable link</li><li><Check aria-hidden="true" />Project submission for institutional verification</li></ul>
          {data.billingEnabled
            ? <Link className="landing-button button-primary" to={user?.role === 'learner' ? '/app/billing' : '/login'} state={{ from: '/app/billing' }}>Explore Premium</Link>
            : <p className="pricing-unavailable" role="status">Premium upgrades aren’t available yet.</p>}
        </article>
      </div>}
      <p className="pricing-note">Premium is paid by card through Paystack. Verification is always done by your institution, never by payment.</p>
    </div>
  </section>
}
