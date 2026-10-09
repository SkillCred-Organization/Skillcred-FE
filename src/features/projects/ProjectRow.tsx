import { ChevronRight, Code } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import type { Project, Status } from '../../types'

const rowAction: Partial<Record<Status, string>> = {
  'self-reported': 'Request verification',
  draft: 'Continue',
  'needs-changes': 'Fix',
}

export default function ProjectRow({ project }: { project: Project }) {
  const action = rowAction[project.status]
  return (
    <li className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cream text-ink-muted">
        <Code className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">{project.title}</h3>
          <Badge status={project.status} />
        </div>
        <p className="text-sm text-ink-muted">{project.summary}</p>
        <p className="text-xs text-ink-muted">{project.meta}</p>
      </div>
      {action ? (
        <Button variant="outline" size="sm">{action}</Button>
      ) : (
        <ChevronRight className="size-4 text-ink-muted" />
      )}
    </li>
  )
}
