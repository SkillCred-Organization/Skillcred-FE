import type { ToastApi } from '../../components/ui/toastContext'
import type { Project } from '../../types'

export function announceProjectAdded(toast: ToastApi, project: Project) {
  if (project.status === 'draft') toast.success('Draft saved. Only you can see it.')
  else if (project.status === 'pending') toast.success('Project submitted for verification.')
  else toast.success('Project added as Self-reported.')
}