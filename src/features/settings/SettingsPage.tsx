import { useState } from 'react'
import { LockKeyhole, Mail, MapPin, Upload, UserRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import LogoutModal from '../../components/layout/LogoutModal'
import { useToast } from '../../components/ui/toastContext'
import { useAuth } from '../auth/authContext'
import { settingsApi, type AccountProfile } from '../../lib/settings'
import { trackEvent } from '../../lib/analytics'
import { useResource } from '../../hooks/useResource'
import { ErrorNotice, PageHeading, Panel, PersonAvatar, ResourceState, Unavailable } from '../admin/AdminUI'
import { DataExport, NotificationPreferences, PasswordSettings } from './SettingsSections'
import '../../workspace.css'

function AccountForm({ profile }: { profile: AccountProfile | null }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const values = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try { await settingsApi.saveProfile({ headline: String(values.get('headline')).trim(), location: String(values.get('location')).trim() }); trackEvent('account_updated'); toast.success('Account changes saved.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save account changes.') }
    finally { setBusy(false) }
  }
  return <Panel><form onSubmit={save} className="workspace-form"><ErrorNotice message={error} /><div className="photo-control"><PersonAvatar name={user?.fullName} large /><Button variant="outline" icon={<Upload size={16} />} disabled>Change photo</Button></div><Unavailable>Photo uploads are not available yet.</Unavailable><div className="workspace-form-columns"><Input label="Full name" value={user?.fullName || ''} readOnly icon={<UserRound size={20} />} /><Input label="Headline" name="headline" defaultValue={profile?.headline || ''} placeholder="e.g. Backend Engineer" maxLength={100} disabled={busy} /></div><Input label="Email" value={user?.email || ''} readOnly icon={<Mail size={20} />} helperText="To change your name or email, contact hello@skillcred.app." /><Input label="Location" name="location" defaultValue={profile?.location || ''} maxLength={100} placeholder="e.g. Lagos, Nigeria" disabled={busy} icon={<MapPin size={20} />} /><Button type="submit" loading={busy} className="self-start">Save changes</Button></form></Panel>
}

function AccountSettings() {
  const resource = useResource(settingsApi.profile)
  const [logout, setLogout] = useState(false)
  return <><ResourceState {...resource} retry={resource.reload} />{resource.data && <AccountForm profile={resource.data.profile} />}<Panel className="danger-panel"><div><h2>Delete account</h2><p>Removes your profile and all claims for good.</p><Unavailable>Account deletion is not available here yet. Contact support for help.</Unavailable></div><Button variant="outline" disabled>Delete account</Button></Panel><button className="settings-logout workspace-link" onClick={() => setLogout(true)}>Log out</button>{logout && <LogoutModal onClose={() => setLogout(false)} />}</>
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const tab = params.get('tab') === 'notifications' ? 'notifications' : params.get('tab') === 'security' ? 'security' : 'account'
  return <div className="workspace learner-settings"><PageHeading title="Settings" description="Manage your account, emails and security." back="/app/profile" /><div className="settings-tabs" role="tablist" aria-label="Settings">{[{ id: 'account', label: 'Account' }, { id: 'notifications', label: 'Notifications' }, { id: 'security', label: 'Security & data' }].map(item => <button role="tab" aria-selected={tab === item.id} aria-controls="settings-content" id={`settings-tab-${item.id}`} key={item.id} onClick={() => setParams({ tab: item.id })}>{item.label}</button>)}</div><div id="settings-content" role="tabpanel" aria-labelledby={`settings-tab-${tab}`} className="settings-content workspace-stack">{tab === 'account' ? <AccountSettings /> : tab === 'notifications' ? <NotificationPreferences email={user?.email} /> : <><PasswordSettings /><Panel><h2>Connected accounts</h2><p>Google account connections can’t be changed here yet.</p><Button variant="outline" disabled>Disconnect Google</Button></Panel><Panel><h2>Sessions</h2><p><LockKeyhole size={18} className="inline" /> Changing your password signs you out of other devices.</p><Unavailable>A list of devices and individual session controls is not available.</Unavailable></Panel><DataExport /></>}</div></div>
}
