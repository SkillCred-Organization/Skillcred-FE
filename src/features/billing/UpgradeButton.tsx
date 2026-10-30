import { useState } from 'react'
import type { ComponentProps } from 'react'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { billingErrorText, startCheckout } from '../../lib/billing'

type UpgradeButtonProps = {
  label?: string
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
  className?: string
}

export default function UpgradeButton({ label = 'Upgrade to Premium', variant = 'primary', size = 'md', className }: UpgradeButtonProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function start() {
    setBusy(true)
    try {
      window.location.assign(await startCheckout()) // the learner pays on Paystack's own page
    } catch (err) {
      setBusy(false)
      toast.error(billingErrorText(err, "We couldn't start your payment. Please try again."))
    }
  }

  return (
    <Button variant={variant} size={size} className={className} loading={busy} onClick={start}>
      {label}
    </Button>
  )
}