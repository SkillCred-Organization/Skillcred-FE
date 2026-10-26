import { Share2, ShieldCheck } from 'lucide-react'
import Button from '../../components/ui/Button'

type VerificationBannerProps = {
  institution: string
  verified: number
  total: number
  waiting: number
  needsChanges: number
  onShare?: () => void
}

export default function VerificationBanner({
  institution,
  verified,
  total,
  waiting,
  needsChanges,
  onShare
}: VerificationBannerProps) {
  const percent = total === 0 ? 0 : Math.round((verified / total) * 100)
  const allVerified = total > 0 && verified === total

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-banner-line bg-banner p-4 md:flex-row md:items-center md:p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-ink">
        <ShieldCheck className="size-5" />
      </span>

      <div className="flex-1">
        <h2 className="text-base font-semibold text-ink md:text-lg">
          {verified} of {total} items verified by {institution}
        </h2>
        <p className="text-sm text-ink-muted">
          {allVerified
            ? 'Your whole portfolio is verified. Share it with employers.'
            : `${waiting} waiting for review · ${needsChanges} needs changes`}
        </p>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-banner-line"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <Button  onClick={onShare} variant="accent" icon={<Share2 className="size-4" />}
      className="w-full md:w-auto">
        Share profile
      </Button>
    </section>
  )
}