import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Bell, ChevronRight, Code, LogOut, Share2, SlidersHorizontal, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import LogoutModal from '../../components/layout/LogoutModal'
import { mockUser } from '../../lib/mockData'

type Item = { to: string; label: string; icon: LucideIcon }

const profileItems: Item[] = [
  { to: '/app/share', label: 'Share profile', icon: Share2 },
  { to: '/app/certifications', label: 'Certifications', icon: Award },
  { to: '/app/skills', label: 'Skills', icon: Code },
  { to: '/app/achievements', label: 'Achievements', icon: Star },
]

const accountItems: Item[] = [
  { to: '/app/settings', label: 'Settings', icon: SlidersHorizontal },
  { to: '/app/settings', label: 'Notifications', icon: Bell },
]

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{title}</h2>
      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={label}>
            <Link to={to} className="flex h-12 items-center gap-3 px-4 text-sm text-ink hover:bg-cream">
              <Icon className="size-4 text-ink-muted" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-4 text-ink-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ProfilePage() {
  const [loggingOut, setLoggingOut] = useState(false)

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-ink">Profile</h1>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white p-4">
        <Avatar initials={mockUser.initials} size="lg" />
        <div>
          <p className="font-medium text-ink">{mockUser.name}</p>
          <p className="text-sm text-ink-muted">{mockUser.role}</p>
        </div>
      </div>

      <Group title="Your profile" items={profileItems} />
      <Group title="Account" items={accountItems} />

      <button
        type="button"
        onClick={() => setLoggingOut(true)}
        className="mt-6 flex h-12 w-full items-center gap-3 rounded-xl border border-line bg-white px-4 text-sm text-error hover:bg-cream"
      >
        <LogOut className="size-4" />
        Log out
      </button>

      {loggingOut && <LogoutModal onClose={() => setLoggingOut(false)} />}
    </div>
  )
}