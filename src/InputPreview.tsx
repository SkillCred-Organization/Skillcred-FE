import { Lock, Mail, User } from 'lucide-react'
import Input from './components/ui/Input'

export default function InputPreview() {
  return (
    <div className="max-w-sm space-y-5 bg-page p-8">
      <Input label="Project title" placeholder="e.g. Payments API" helperText="Shown on your public profile" />
      <Input label="Full name" icon={<User className="size-4" />} defaultValue="Adaeze Okafor" />
      <Input label="Email" type="email" icon={<Mail className="size-4" />} placeholder="you@example.com" />
      <Input label="Password" type="password" icon={<Lock className="size-4" />} placeholder="Create a password" />
      <Input label="Project title" error="Add a project title" placeholder="e.g. Payments API" />
      <Input label="Project title" disabled placeholder="e.g. Payments API" />
    </div>
  )
}