import { Award } from 'lucide-react'
import ItemsPage from './ItemsPage'
import type { ItemsCopy } from './ItemsPage'

const copy: ItemsCopy = {
  kind: 'certifications',
  title: 'Certifications',
  subtitle: 'Certificates from your programme or other courses.',
  noun: 'certification',
  icon: Award,
  issuerLabel: 'Issued by',
  issuerPlaceholder: 'e.g. Amazon Web Services',
  dateLabel: 'Issue date',
  emptyTitle: 'No certifications yet',
  emptyMessage: 'Add a certificate from your programme or a course you took.',
}

export default function CertificationsPage() {
  return <ItemsPage copy={copy} />
}