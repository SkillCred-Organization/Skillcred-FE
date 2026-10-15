import { useState } from 'react'
import { Download, LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/toastContext'
import { settingsApi } from '../../lib/settings'
import { trackEvent } from '../../lib/analytics'
import { ErrorNotice, Panel, Unavailable } from '../admin/AdminUI'

export function NotificationPreferences({ admin = false, email }: { admin?: boolean; email?: string }) {
  const labels = admin ? ['A learner submits a claim', 'A claim has waited over 7 days', 'SkillCred news and updates'] : ['A claim gets a decision', 'Someone asks me to confirm their work', 'A teammate replies to my request', 'Weekly reminders to finish my profile', 'SkillCred news and updates']
  return <Panel><h2>Email me when</h2><p className="workspace-note">Email address: {email}</p><Unavailable>Email preferences are not available yet. Review decisions and account emails will still be sent.</Unavailable><div className="notification-options">{labels.map(label => <div key={label} className="preference-row"><span>{label}</span><button type="button" role="switch" aria-checked={false} aria-label={label} disabled className="preference-switch" /></div>)}</div><Button disabled>Save preferences</Button></Panel>
}

export function PasswordSettings() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    const password = String(values.get('newPassword'))
    if (password.length < 8 || !/\d/.test(password)) { setError('Use at least 8 characters, including a number.'); return }
    setBusy(true); setError('')
    try { await settingsApi.changePassword(String(values.get('currentPassword')), password); form.reset(); trackEvent('password_changed'); toast.success('Password updated. You’ve been logged out on other devices.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to update your password.') }
    finally { setBusy(false) }
  }
  return <Panel><h2>Password</h2><form className="workspace-form" onSubmit={update}><ErrorNotice message={error} /><Input type="password" label="Current password" name="currentPassword" autoComplete="current-password" required disabled={busy} icon={<LockKeyhole size={20} />} /><Input type="password" label="New password" name="newPassword" autoComplete="new-password" required minLength={8} pattern="(?=.*[0-9]).{8,}" helperText="At least 8 characters, with a number" disabled={busy} icon={<LockKeyhole size={20} />} /><Button variant="outline" type="submit" loading={busy} className="self-start">Update password</Button><p className="workspace-note">Updating your password logs out your other devices. If you signed up with Google and don’t have a password, <Link to="/forgot-password" className="workspace-link">set one using a password reset</Link>.</p></form></Panel>
}

export function DataExport() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  async function download() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const result = await settingsApi.exportData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = 'skillcred-data.json'; document.body.append(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      trackEvent('data_exported'); toast.success('Your data download has started.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to download your data.') }
    finally { setBusy(false) }
  }
  return <Panel><h2>Your data</h2><p>Download a copy of your profile and claims as a JSON file.</p><ErrorNotice message={error} /><Button variant="outline" loading={busy} icon={<Download size={16} />} onClick={() => void download()}>Download my data</Button></Panel>
}
