import { useState } from 'react'
import { Award, Code, Folder, House, LogOut, PanelLeft, ShieldCheck, Share2, SlidersHorizontal, Star } from 'lucide-react'
import Avatar from '../ui/Avatar'
import NavItem from './NavItem'
import { mockCounts, mockUser } from '../../lib/mockData'
import LogoutModal from './LogoutModal'

type SidebarProps = { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white p-3 transition-[width] md:flex ${
        collapsed ? 'w-18' : 'w-60'
      }`}
    >
      <div className={`mb-6 flex h-10 items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
        {!collapsed && <img src="/logo.svg" alt="SkillCred" className="h-6" />}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
        >
          <PanelLeft className="size-4" />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <NavItem to="/app/dashboard" icon={House} label="Dashboard" collapsed={collapsed} />
        {!collapsed && (
          <p className="mt-4 px-3 text-[11px] font-medium uppercase tracking-wider text-ink-muted">Portfolio</p>
        )}
        <NavItem to="/app/projects" icon={Folder} label="Projects" count={mockCounts.projects} collapsed={collapsed} />
        <NavItem to="/app/certifications" icon={Award} label="Certifications" count={mockCounts.certifications} collapsed={collapsed} />
        <NavItem to="/app/skills" icon={Code} label="Skills" count={mockCounts.skills} collapsed={collapsed} />
        <NavItem to="/app/achievements" icon={Star} label="Achievements" count={mockCounts.achievements} collapsed={collapsed} />
        <NavItem to="/app/verification" icon={ShieldCheck} label="Verification" count={mockCounts.verification} collapsed={collapsed} />
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <NavItem to="/app/share" icon={Share2} label="Share profile" collapsed={collapsed} />
        <NavItem to="/app/settings" icon={SlidersHorizontal} label="Settings" collapsed={collapsed} />
        <button
          type="button"

          onClick={() => setLoggingOut(true)}
          className={`flex h-10 items-center gap-3 rounded-lg text-sm text-ink-muted hover:bg-cream ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && 'Log out'}
        </button>

        <div className={`mt-2 flex items-center gap-3 border-t border-line pt-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <Avatar initials={mockUser.initials} />
          {!collapsed && (
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-ink">{mockUser.name}</p>
              <p className="text-xs text-ink-muted">{mockUser.role}</p>
            </div>
          )}
        </div>
      </div>
      {loggingOut && <LogoutModal onClose={() => setLoggingOut(false)} />}
    </aside>
  )
}