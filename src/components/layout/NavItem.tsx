import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

type NavItemProps = {
  to: string
  icon: LucideIcon
  label: string
  count?: number
  collapsed?: boolean
}

export default function NavItem({ to, icon: Icon, label, count, collapsed = false }: NavItemProps) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex h-10 items-center gap-3 rounded-lg text-sm transition-colors ${
          collapsed ? 'justify-center' : 'px-3'
        } ${isActive ? 'bg-accent-light font-medium text-ink' : 'text-ink-muted hover:bg-cream'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span className="flex-1">{label}</span>}
          {!collapsed && count !== undefined && (
            <span
              className={`rounded-full px-2 text-xs ${
                isActive ? 'bg-accent text-ink' : 'bg-sand text-ink-muted'
              }`}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}