import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { loadGoogleIdentity, renderGoogleButton } from '../../lib/googleIdentity'

export default function GoogleAuthButton({ label, disabled, requiresConsent = false, onConsentRequired, onCredential, onError, onBusyChange }: {
  label: string; disabled?: boolean; requiresConsent?: boolean; onConsentRequired?: () => void
  onCredential: (credential: string) => Promise<void>; onError: (error: unknown) => void
  onBusyChange: (busy: boolean) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const processing = useRef(false)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const receiveCredential = useEffectEvent(async (credential: string) => {
    if (disabled || requiresConsent || processing.current) return
    processing.current = true
    setBusy(true)
    onBusyChange(true)
    try { await onCredential(credential) }
    catch (error) { onError(error) }
    finally { processing.current = false; setBusy(false); onBusyChange(false) }
  })

  useEffect(() => {
    if (requiresConsent) return
    const parent = host.current
    if (!parent) return
    let cancelled = false
    let disposeButton: (() => void) | undefined
    let observer: ResizeObserver | undefined
    loadGoogleIdentity().then(id => {
      if (cancelled) return
      const button = renderGoogleButton(id, parent, label === 'Continue with Google' ? 'continue_with' : 'signin_with',
        credential => { void receiveCredential(credential) })
      disposeButton = button.dispose
      const resize = () => button.resize(parent.parentElement?.clientWidth ?? 320)
      resize()
      observer = new ResizeObserver(resize)
      observer.observe(parent.parentElement ?? parent)
      setReady(true)
    }).catch(error => {
      if (!cancelled) {
        disposeButton?.()
        setLoadError(error instanceof Error ? error.message : 'Unable to load Google sign-in. Please use email.')
      }
    })
    return () => { cancelled = true; observer?.disconnect(); disposeButton?.() }
  }, [attempt, label, requiresConsent])

  return <div className="auth-google-area" aria-busy={busy || (!requiresConsent && !ready && !loadError)}>
    {requiresConsent ? <>
      <button type="button" className="auth-google" disabled={disabled} onClick={onConsentRequired} aria-describedby="google-consent-hint">
        <img src="/google.png" alt="" width={24} height={24} />{label}
      </button>
      <p id="google-consent-hint" className="auth-google-hint">To continue with Google, tick the Terms and Privacy Policy checkbox below.</p>
    </> : <>
      <div ref={host} className="auth-google-host" hidden={!ready || busy || !!loadError} inert={disabled || busy} data-disabled={disabled || undefined} />
      {(busy || (!ready && !loadError)) && <button type="button" className="auth-google" disabled>
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />{busy ? 'Signing in…' : 'Loading Google…'}
      </button>}
      {loadError && <div className="auth-google-hint" role="alert">
        <p>{loadError}</p>
        <button type="button" className="auth-link" disabled={disabled} onClick={() => { setLoadError(''); setReady(false); setAttempt(value => value + 1) }}>Retry Google sign-in</button>
      </div>}
    </>}
  </div>
}
