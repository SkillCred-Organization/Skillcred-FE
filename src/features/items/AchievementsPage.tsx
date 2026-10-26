import { GraduationCap } from 'lucide-react'
import ItemsPage from './ItemsPage'
import type { ItemsCopy } from './ItemsPage'

const copy: ItemsCopy = {
  kind: 'achievements',
  title: 'Achievements',
  subtitle: 'Awards, competitions and recognitions.',
  noun: 'achievement',
  icon: GraduationCap,
  issuerLabel: 'Awarded by',
  issuerPlaceholder: 'e.g. Lagos Startup Week',
  dateLabel: 'Date',
  emptyTitle: 'No achievements yet',
  emptyMessage: 'Add awards, competitions or recognition you have received.',
}

export default function AchievementsPage() {
  return <ItemsPage copy={copy} />
}