import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import InlineAlert from '../../components/ui/InlineAlert'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/toastContext'
import { isHandleAvailable, saveHandle } from '../../lib/api'
import { errorText } from '../../lib/errors'

type HandleEditorProps = {
  current: string
  suggestion: string
  onSaved: (handle: string) => void
  onCancel?: () => void
}

type Checked = { handle: string; available: boolean | null }

export default function HandleEditor({ current, suggestion, onSaved, onCancel }: HandleEditorProps) {
  const toast = useToast()
  const [value, setValue] = useState(current || suggestion)
  const [checked, setChecked] = useState<Checked | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const valid = /^[a-z0-9-]{3,30}$/.test(value)
  const unchanged = value === current

  useEffect(() => {
    if (!valid || unchanged) return
    let cancelled = false
    const timer = setTimeout(() => {
      isHandleAvailable(value)
        .then((available) => {
          if (!cancelled) setChecked({ handle: value, available })
        })
        .catch(() => {
          if (!cancelled) setChecked({ handle: value, available: null })
        })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, valid, unchanged])

  const result = checked?.handle === value ? checked.available : undefined // undefined = still checking
  const taken = result === false

  let hint = 'Checking…'
  if (!value) hint = 'Choose a link.'
  else if (!valid) hint = 'Use 3 to 30 lowercase letters, numbers or hyphens.'
  else if (unchanged) hint = 'This is your current link.'
  else if (result === true) hint = 'Available'
  else if (result === null) hint = "Couldn't check it. You can still try to save."

  async function save() {
    setSaving(true)
    setError('')
    try {
      await saveHandle(value)
      toast.success('Profile link saved.')
      onSaved(value)
    } catch (err) {
      setSaving(false)
      setError(errorText(err, "Couldn't save your link. Please try again."))
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-ink">
        {current ? 'Change your link' : 'Choose your profile link'}
      </h2>
      <p className="mb-3 text-sm text-ink-muted">This is the address people open to see your profile.</p>
      <Input
        label="Your profile link"
        placeholder="your-name"
        value={value}
        onChange={(e) => {
          setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          setError('')
        }}
        autoComplete="off"
        helperText={
          <span>
            {window.location.host}/u/<strong>{value || 'your-name'}</strong> · {hint}
          </span>
        }
        error={taken ? 'Already taken. Try another.' : !valid && value ? hint : undefined}
      />
      {error && (
        <InlineAlert variant="error" title="Couldn't save your link" className="mt-3">
          {error}
        </InlineAlert>
      )}
      <div className="mt-3 flex gap-2">
        <Button loading={saving} disabled={!valid || taken || unchanged} onClick={save}>
          Save link
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}