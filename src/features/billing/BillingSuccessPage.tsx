import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Clock, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '../../components/ui/Button'
import { ApiError } from '../../lib/apiClient'
import { formatNaira, verifyPayment } from '../../lib/billing'
import type { VerifyResult } from '../../lib/billing'
import { formatDate } from '../../lib/format'
import UpgradeButton from './UpgradeButton'
import { usePremiumPlan } from './usePremiumPlan'

type Phase = 'checking' | 'waiting' | 'paid' | 'failed' | 'timeout' | 'missing' | 'error'

const linkButton =
  'inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-medium text-white hover:bg-brand-dark'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 break-all text-base text-ink">{value}</dd>
      <p className="mt-3 text-sm text-ink-muted">Renews automatically every month. Cancel anytime.</p>
    </div>
  )
}

export default function BillingSuccessPage() {
  const [params] = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref') ?? ''
  const [phase, setPhase] = useState<Phase>('checking')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const { premium } = usePremiumPlan()

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    async function check() {
      try {
        const res = await verifyPayment(reference)
        if (cancelled) return
        if (res.paid) {
          setResult(res)
          setPhase('paid')
          return
        }
        if (['abandoned', 'failed'].includes(res.paymentStatus)) {
          setPhase('failed')
          return
        }
        tries += 1
        if (tries >= 10) {
          setPhase('timeout') // about 30 seconds
          return
        }
        setPhase('waiting')
        timer = setTimeout(check, 3000)
      } catch (err) {
        if (cancelled) return
        setPhase(err instanceof ApiError && err.status === 404 ? 'missing' : 'error')
      }
    }

    void check()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [reference, attempt])

  const current: Phase = reference ? phase : 'missing'
  const price = premium ? formatNaira(premium.priceNgn) : ''
  const until = result?.paidThrough ? formatDate(result.paidThrough) : ''

  const retry = (
    <Button
      onClick={() => {
        setPhase('checking')
        setAttempt((a) => a + 1)
      }}
    >
      Check again
    </Button>
  )
  const toProjects = (
    <Link to="/app/projects" className={linkButton}>
      Back to my projects
    </Link>
  )

  const content: Record<Phase, { icon: LucideIcon; tone: string; title: string; text: string; body?: ReactNode; actions: ReactNode }> = {
    checking: {
      icon: Clock,
      tone: 'bg-pending-bg text-pending-text',
      title: 'Confirming your payment…',
      text: 'This usually takes a few seconds. Please keep this page open.',
      actions: null,
    },
    waiting: {
      icon: Clock,
      tone: 'bg-pending-bg text-pending-text',
      title: "We're still confirming your payment",
      text: 'This usually takes a few seconds. Please keep this page open.',
      actions: null,
    },
    paid: {
      icon: Check,
      tone: 'bg-verified-bg text-verified-text',
      title: "You're on Premium",
      text: `We received your ${price} payment.${until ? ` Premium is active until ${until}, and you can now add more than 2 projects.` : ' You can now add more than 2 projects.'}`,
      body: (
        <>
          <dl className="mt-5 divide-y divide-line border-t border-line">
            <Row label="Plan" value="Premium · monthly" />
            {price && <Row label="Amount paid" value={price} />}
            <Row label="Reference" value={reference} />
            {until && <Row label="Renews" value={until} />}
          </dl>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-pending-bg p-3 text-sm text-ink">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pending-text" />
            <p>Premium doesn't verify projects. Your institution still reviews every request.</p>
          </div>
        </>
      ),
      actions: (
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/app/projects" className={linkButton}>
            Add a project
          </Link>
          <Link to="/app/dashboard" className="text-sm font-medium text-brand">
            Go to dashboard
          </Link>
        </div>
      ),
    },
    failed: {
      icon: TriangleAlert,
      tone: 'bg-changes-bg text-changes-text',
      title: "Your payment didn't go through",
      text: 'You have not been charged, and you are still on the Free plan.',
      actions: <UpgradeButton label="Try again" />,
    },
    timeout: {
      icon: Clock,
      tone: 'bg-pending-bg text-pending-text',
      title: 'This is taking longer than expected',
      text: 'If you paid, your plan will update by itself once Paystack confirms it. You can check again or carry on.',
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          {retry}
          {toProjects}
        </div>
      ),
    },
    missing: {
      icon: TriangleAlert,
      tone: 'bg-changes-bg text-changes-text',
      title: "We couldn't find that payment",
      text: 'The payment reference is missing or does not belong to your account.',
      actions: (
        <Link to="/app/billing" className={linkButton}>
          See plans
        </Link>
      ),
    },
    error: {
      icon: TriangleAlert,
      tone: 'bg-changes-bg text-changes-text',
      title: "We couldn't check your payment",
      text: 'Please try again in a moment. If you paid, your plan will update by itself.',
      actions: retry,
    },
  }

  const { icon: Icon, tone, title, text, body, actions } = content[current]

  return (
    <div className="mx-auto w-full max-w-xl">
      <div role="status" className="rounded-2xl border border-line bg-white p-5 sm:p-8">
        <span className={`mb-4 flex size-14 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{text}</p>
        {body}
        {actions && <div className="mt-6">{actions}</div>}
      </div>
    </div>
  )
}