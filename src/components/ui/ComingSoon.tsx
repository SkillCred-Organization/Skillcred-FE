import { Clock } from 'lucide-react'
import EmptyState from './EmptyState'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">{title}</h1>
      <EmptyState icon={Clock} title="This page is on its way" message="We're still building it. Check back soon." />
    </div>
  )
}