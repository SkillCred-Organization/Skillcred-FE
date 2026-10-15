import { useState } from 'react'
import { Bell, Building2, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Home, ListChecks, LogOut, PanelLeftClose, PanelLeftOpen, Settings, UserRound, Users } from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../../components/Logo'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LogoutModal from '../../components/layout/LogoutModal'
import AuthPageLayout from '../../components/pages/AuthPageLayout'
import { useAuth } from '../auth/authContext'
import { adminApi } from '../../lib/admin'
import { useResource } from '../../hooks/useResource'
import { ErrorNotice, PersonAvatar, ResourceState } from './AdminUI'
import { useInstitution } from './adminContext'
import '../../workspace.css'

const links = [{ to: 'dashboard', label: 'Dashboard', icon: Home }, { to: 'queue', label: 'Review queue', icon: ListChecks }, { to: 'learners', label: 'Learners', icon: Users }, { to: 'institution', label: 'Institution', icon: Building2 }, { to: 'notifications', label: 'Notifications', icon: Bell }]

function InstitutionSetup() {
  const { refresh, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const values = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      await adminApi.registerInstitution({ institutionName: String(values.get('name')), website: String(values.get('website')), registrationNumber: String(values.get('registrationNumber')), jobTitle: String(values.get('jobTitle')), authorised: true })
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to register your institution.') }
    finally { setBusy(false) }
  }
  return <AuthPageLayout><section className="auth-panel"><h1>Register your institution</h1><p className="auth-description">Add your institution to start reviewing learner claims. Your work email must use its website domain.</p><form className="workspace-form" onSubmit={submit}><ErrorNotice message={error} /><Input name="name" label="Institution name" required maxLength={200} /><Input name="website" label="Website" type="url" placeholder="https://institution.edu" pattern="https://.*" required /><Input name="registrationNumber" label="Registration number (optional)" maxLength={100} /><Input name="jobTitle" label="Job title" required maxLength={100} /><label className="workspace-checkbox"><input type="checkbox" required />I’m authorised to verify learner claims for this institution.</label><Button type="submit" loading={busy}>Register institution</Button><Button variant="ghost" onClick={logout}>Log out</Button></form></section></AuthPageLayout>
}

function InstitutionGate() {
  const { user, logout } = useAuth()
  const resource = useResource(adminApi.institution)
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()
  if (!resource.data) return <div className="workspace workspace-standalone"><ResourceState {...resource} retry={resource.reload} /></div>
  const { institution } = resource.data
  if (institution.status !== 'approved') return <AuthPageLayout><section className="auth-panel auth-status"><div className="auth-status-icon"><Clock3 /></div><h1>{institution.status === 'rejected' ? 'Your institution needs attention' : `We’re checking ${institution.name}`}</h1><p className="auth-description">{institution.status === 'rejected' ? 'Contact SkillCred for help with your institution’s registration.' : `We’ll email ${user?.email} when your institution is ready to review learner claims.`}</p><ul className="approval-steps"><li><Check />Account created</li><li><Check />Institution details submitted</li><li><Clock3 />Institution check {institution.status === 'rejected' ? 'needs attention' : 'in progress'}</li><li><ListChecks />Start reviewing claims</li></ul><Button onClick={resource.reload}>Check status</Button><a className="auth-back auth-link" href="mailto:hello@skillcred.app">Contact SkillCred</a><button className="auth-back" onClick={logout}>Log out</button></section></AuthPageLayout>
  const detail = location.pathname.startsWith('/admin/claims/') || location.pathname === '/admin/settings' || location.pathname === '/admin/institution'
  return <div className={`workspace admin-workspace ${collapsed ? 'sidebar-collapsed' : ''} ${detail ? 'workspace-detail' : ''}`}>
    <aside className="admin-sidebar"><div className="admin-brand">{collapsed ? <Link to="/" aria-label="SkillCred home"><img src="/favicon.svg" alt="" width="30" /></Link> : <Logo />}<button className="icon-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button></div><nav aria-label="Admin navigation">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={`/admin/${to}`} title={collapsed ? label : undefined} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><Icon size={20} /><span>{label}</span></NavLink>)}</nav><div className="admin-sidebar-bottom"><NavLink to="/admin/settings" className="admin-nav-link"><Settings size={20} /><span>Settings</span></NavLink><button className="admin-nav-link" onClick={() => setLoggingOut(true)}><LogOut size={20} /><span>Log out</span></button><Link to="/admin/profile" className="admin-user"><PersonAvatar name={user?.fullName} /><div><strong>{user?.fullName}</strong><small>Admin</small></div></Link></div></aside>
    <main className="admin-main"><Outlet context={{ ...resource.data, reloadInstitution: resource.reload }} /></main>
    {!detail && <nav className="admin-mobile-nav" aria-label="Mobile navigation">{[{ to: 'dashboard', label: 'Home', icon: Home }, { to: 'queue', label: 'Queue', icon: ListChecks }, { to: 'learners', label: 'Learners', icon: Users }, { to: 'profile', label: 'Profile', icon: UserRound }].map(({ to, label, icon: Icon }) => <NavLink key={to} to={`/admin/${to}`} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={22} /><span>{label}</span></NavLink>)}</nav>}
    {loggingOut && <LogoutModal onClose={() => setLoggingOut(false)} />}
  </div>
}

export default function AdminLayout() {
  const { user } = useAuth()
  if (user?.needsInstitution) return <InstitutionSetup />
  if (!user?.emailVerified) return <Navigate to="/verify-email" replace />
  return <InstitutionGate />
}

export function AdminProfile() {
  const { user } = useAuth()
  const { institution, myRole } = useInstitution()
  const [logout, setLogout] = useState(false)
  return <><header className="workspace-heading"><h1>Profile</h1></header><section className="workspace-panel admin-profile-card"><PersonAvatar name={user?.fullName} large /><div><h2>{user?.fullName}</h2><p>{institution.name} · {myRole === 'owner' ? 'Owner' : 'Reviewer'}</p></div></section>{[{ title: 'Institution', items: [{ label: 'Institution', to: '/admin/institution', icon: Building2 }, { label: 'Learners', to: '/admin/learners', icon: Users }] }, { title: 'Account', items: [{ label: 'Settings', to: '/admin/settings', icon: Settings }, { label: 'Notifications', to: '/admin/notifications', icon: Bell }] }].map(group => <section key={group.title} className="profile-menu"><h2>{group.title}</h2>{group.items.map(({ label, to, icon: Icon }) => <Link to={to} key={to}><Icon size={20} /><span>{label}</span><ChevronRight size={20} /></Link>)}</section>)}<a className="profile-help" href="mailto:hello@skillcred.app"><CircleHelp size={20} />Help and support</a><button className="profile-logout" onClick={() => setLogout(true)}><LogOut size={20} />Log out</button>{logout && <LogoutModal onClose={() => setLogout(false)} />}</>
}

export function AdminBack({ children }: { children: React.ReactNode }) { return <Link to="/admin/profile" className="workspace-back"><ChevronLeft size={20} />{children}</Link> }
