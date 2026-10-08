import { Folder, House, ShieldCheck, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/app/dashboard', label: 'Home', icon: House },
  { to: '/app/projects', label: 'Projects', icon: Folder },
  { to: '/app/verification', label: 'Verify', icon: ShieldCheck },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export default function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white px-2 py-2 md:hidden">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className="flex flex-col items-center gap-1 text-[11px] text-ink-muted">
          {({ isActive }) => (
            <>
              <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-accent-light text-ink' : ''}`}>
                <Icon className="size-4" />
              </span>
              <span className={isActive ? 'font-semibold text-ink' : ''}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}