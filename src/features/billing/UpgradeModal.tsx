import Button from '../../components/ui/Button'
import InlineAlert from '../../components/ui/InlineAlert'
import Modal from '../../components/ui/Modal'
import { formatNaira } from '../../lib/billing'
import type { BillingMe } from '../../lib/billing'
import UpgradeButton from './UpgradeButton'
import { usePremiumPlan } from './usePremiumPlan'

type UpgradeModalProps = { billing: BillingMe | null; onClose: () => void }

export default function UpgradeModal({ billing, onClose }: UpgradeModalProps) {
  const { premium } = usePremiumPlan()
  const disabled = billing?.billingEnabled === false
  const limit = billing?.projects.limit

  return (
    <Modal
      title="Unlimited projects with Premium"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Not now</Button>
          {!disabled && <UpgradeButton label="Upgrade to Premium" />}
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink">
          {typeof limit === 'number'
            ? `Your Free Plan includes ${limit} projects, and you're using ${limit === 2 ? 'both' : 'all of them'}. Pay once for lifetime Premium access and unlimited projects. Your existing projects stay exactly as they are.`
            : 'Premium has no project limit.'}
        </p>
        {premium && (
          <p className="text-sm text-ink-muted">
            <span className="text-2xl font-semibold text-ink">{formatNaira(premium.priceNgn)}</span> one-time payment · lifetime access · paid by card
          </p>
        )}
        {disabled && (
          <InlineAlert variant="info" title="Payments aren't switched on yet">
            Premium is coming soon. Your projects are safe.
          </InlineAlert>
        )}
      </div>
    </Modal>
  )
}
