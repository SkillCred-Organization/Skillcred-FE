import Badge from './components/ui/Badge'

export default function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-3 bg-page p-8">
      <Badge status="verified" />
      <Badge status="team-confirmed" />
      <Badge status="pending" />
      <Badge status="needs-changes" />
      <Badge status="self-reported" />
      <Badge status="draft" />
    </div>
  )
}