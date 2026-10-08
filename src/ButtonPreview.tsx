import { Plus } from 'lucide-react'
import Button from './components/ui/Button'

export default function ButtonPreview() {
  const variants = ['primary', 'accent', 'soft', 'outline', 'ghost'] as const
  return (
    <div className="space-y-4 bg-page p-8">
      {variants.map((v) => (
        <div key={v} className="flex items-center gap-3">
          <Button variant={v} icon={<Plus className="size-4" />}>Add project</Button>
          <Button variant={v} size="sm">Small</Button>
          <Button variant={v} disabled>Disabled</Button>
          <Button variant={v} loading>Loading</Button>
        </div>
      ))}
    </div>
  )
}