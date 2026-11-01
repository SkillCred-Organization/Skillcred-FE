import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import Toggle from '../../components/ui/Toggle'
import { useToast } from '../../components/ui/toastContext'
import { getNotificationSettings, updateNotificationSettings } from '../../lib/notifications'
import { ErrorNotice, Panel } from '../admin/AdminUI'

export default function EmailNotificationsSettings({ email }: { email?: string }) {
  const toast = useToast()
  const [verification, setVerification] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getNotificationSettings()
      .then((r) => {
        if (!cancelled) setVerification(r.settings.email.verification)
      })
      .catch(() => {
        if (!cancelled) setLoadError("We couldn't load your notification settings. Please refresh and try again.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function change(next: boolean) {
    const previous = verification
    setVerification(next) // update right away, undo if it fails
    setSaving(true)
    try {
      const r = await updateNotificationSettings(next)
      setVerification(r.settings.email.verification)
      toast.success('Notification settings saved.')
    } catch {
      setVerification(previous)
      toast.error("Couldn't save your change. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel>
      <h2>Email notifications</h2>
      <p>
        <Mail size={18} className="inline" /> Updates about your work go to {email || 'your email'}. In-app
        notifications are always on.
      </p>
      <ErrorNotice message={loadError} />
      {verification !== null && (
        <Toggle
          checked={verification}
          onChange={change}
          disabled={saving}
          label="Verification updates"
          description="Get an email when your institution verifies something or asks for changes."
        />
      )}
      {verification === null && !loadError && <p>Loading…</p>}
    </Panel>
  )
}