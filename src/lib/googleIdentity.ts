type Credential = { credential: string; state?: string }
type ButtonText = 'signin_with' | 'continue_with'
type IdentityClient = {
  initialize: (options: { client_id: string; callback: (response: Credential) => void; auto_select: boolean; ux_mode: 'popup' }) => void
  renderButton: (parent: HTMLElement, options: {
    type: 'standard'; theme: 'outline'; size: 'large'; shape: 'pill'
    text: ButtonText; width: number; state: string
  }) => void
}
declare global { interface Window { google?: { accounts: { id: IdentityClient } } } }

let loadPromise: Promise<IdentityClient> | undefined
const credentialHandlers = new Map<string, (credential: string) => void>()

// A real Google button opens the popup flow; id.prompt() only requests One Tap.
export function loadGoogleIdentity(clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID): Promise<IdentityClient> {
  if (!clientId) return Promise.reject(new Error('Google sign-in is not configured. Please use email for now.'))
  if (loadPromise) return loadPromise
  const loading = new Promise<IdentityClient>((resolve, reject) => {
    if (window.google?.accounts.id) { resolve(window.google.accounts.id); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const timeout = window.setTimeout(() => {
      script.remove()
      reject(new Error('Google took too long to load. Please retry or use email.'))
    }, 15000)
    script.onload = () => {
      window.clearTimeout(timeout)
      const id = window.google?.accounts.id
      if (id) resolve(id)
      else { script.remove(); reject(new Error('Unable to load Google sign-in. Please retry or use email.')) }
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      script.remove()
      reject(new Error('Unable to load Google sign-in. Check your connection, retry, or use email.'))
    }
    document.head.appendChild(script)
  }).then(id => {
    id.initialize({
      client_id: clientId, auto_select: false, ux_mode: 'popup',
      callback: response => {
        if (response.state && typeof response.credential === 'string' && response.credential) {
          credentialHandlers.get(response.state)?.(response.credential)
        }
      },
    })
    return id
  })
  loadPromise = loading
  void loading.catch(() => { if (loadPromise === loading) loadPromise = undefined })
  return loading
}

export function renderGoogleButton(
  id: IdentityClient,
  parent: HTMLElement,
  text: ButtonText,
  onCredential: (credential: string) => void,
) {
  // Route a popup result only to the button that opened it, never to a later page.
  const state = crypto.randomUUID()
  credentialHandlers.set(state, onCredential)
  let previousWidth = 0
  let disposed = false
  function resize(width: number) {
    if (disposed) return
    const nextWidth = Math.max(120, Math.min(400, Math.floor(width)))
    if (nextWidth === previousWidth) return
    parent.replaceChildren()
    id.renderButton(parent, { type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text, width: nextWidth, state })
    previousWidth = nextWidth
  }
  return {
    resize,
    dispose: () => {
      disposed = true
      credentialHandlers.delete(state)
      parent.replaceChildren()
    },
  }
}
