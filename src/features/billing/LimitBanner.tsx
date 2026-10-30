import { Folder } from 'lucide-react'
import Button from '../../components/ui/Button'
import { formatNaira } from '../../lib/billing'
import type { BillingMe } from '../../lib/billing'
import UpgradeButton from './UpgradeButton'
import { usePremiumPlan } from './usePremiumPlan'

type Props = { billing: BillingMe; onDismiss: () => void }

export default function LimitBanner({ billing, onDismiss }: Props) {
  const { premium } = usePremiumPlan()
  const canPay = billing.billingEnabled && billing.canUpgrade
  return (
    <section className="mb-4 flex items-start gap-3 rounded-xl border border-pending-text/20 bg-pending-bg/40 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pending-bg text-pending-text">
        <Folder className="size-5" />
      </span>
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-ink">You've reached your Free Plan limit.</h2>
        <p className="mt-1 text-sm text-ink">
          Upgrade to Premium to add more projects to your SkillCred profile. Your {billing.projects.used} projects stay as they are.
        </p>
        {premium && (
          <p className="mt-3 text-sm text-ink-muted">
            <span className="text-lg font-semibold text-ink">{formatNaira(premium.priceNgn)}</span> per month · paid by card
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canPay && <UpgradeButton label="Upgrade to Premium" />}
          <Button variant="ghost" onClick={onDismiss}>Stay on Free Plan</Button>
        </div>
      </div>
    </section>
  )
}