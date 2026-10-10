import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cancelGoogleSignIn, requestGoogleCredential } from '../../lib/googleIdentity'

export default function GoogleAuthButton({ label, disabled, beforeSignIn, onCredential, onError, onBusyChange }: {
  label: string; disabled?: boolean; beforeSignIn?: () => Promise<boolean>
  onCredential: (credential: string) => Promise<void>; onError: (error: unknown) => void
  onBusyChange: (busy: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  useEffect(() => () => cancelGoogleSignIn(), [])
  async function signIn() {
    if (beforeSignIn && !(await beforeSignIn())) return
    setBusy(true)
    onBusyChange(true)
    try { await onCredential(await requestGoogleCredential()) }
    catch (error) { onError(error) }
    finally { setBusy(false); onBusyChange(false) }
  }
  return <button type="button" className="auth-google" disabled={disabled || busy} onClick={() => void signIn()} aria-busy={busy}>
    {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <img src="/google.png" alt="" width={24} height={24} />}
    {busy ? 'Connecting to Google…' : label}
  </button>
}
