type Credential = { credential: string }
type PromptMoment = { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean; getDismissedReason: () => string }
type IdentityClient = {
  initialize: (options: { client_id: string; callback: (response: Credential) => void; auto_select: boolean }) => void
  prompt: (listener: (moment: PromptMoment) => void) => void
  cancel: () => void
}
declare global { interface Window { google?: { accounts: { id: IdentityClient } } } }
let loadPromise: Promise<IdentityClient> | undefined
let pending: { resolve: (credential: string) => void; reject: (reason: Error) => void } | undefined

function loadGoogle(): Promise<IdentityClient> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) return Promise.reject(new Error('Google sign-in is unavailable right now. Please use email.'))
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const timeout = window.setTimeout(() => { script.remove(); loadPromise = undefined; reject(new Error('Google took too long to load. Please try again.')) }, 15000)
    script.onload = () => {
      window.clearTimeout(timeout)
      const id = window.google?.accounts.id
      if (!id) { loadPromise = undefined; reject(new Error('Unable to load Google sign-in.')); return }
      id.initialize({ client_id: clientId, auto_select: false, callback: response => pending?.resolve(response.credential) })
      resolve(id)
    }
    script.onerror = () => { window.clearTimeout(timeout); script.remove(); loadPromise = undefined; reject(new Error('Unable to load Google sign-in. Check your connection and try again.')) }
    document.head.appendChild(script)
  })
  return loadPromise
}

export async function requestGoogleCredential() {
  const id = await loadGoogle()
  if (pending) throw new Error('Google sign-in is already open.')
  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => { id.cancel(); finish(new Error('Google sign-in was not completed. Please try again or use email.')) }, 90000)
    function finish(result: string | Error) {
      window.clearTimeout(timeout)
      pending = undefined
      if (result instanceof Error) reject(result)
      else resolve(result)
    }
    pending = { resolve: credential => finish(credential), reject: error => finish(error) }
    id.prompt(moment => {
      if (moment.isNotDisplayed() || moment.isSkippedMoment()) finish(new Error('Google sign-in could not open in this browser. Please use email or try again.'))
      else if (moment.isDismissedMoment() && moment.getDismissedReason() !== 'credential_returned') finish(new Error('Google sign-in was cancelled.'))
    })
  })
}
export function cancelGoogleSignIn() {
  window.google?.accounts.id.cancel()
  pending?.reject(new Error('Google sign-in was cancelled.'))
}
