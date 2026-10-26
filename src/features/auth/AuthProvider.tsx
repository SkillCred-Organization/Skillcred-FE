import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthContext } from './authContext'
import { authApi, readStoredUser, saveSession, saveUser, type AuthResponse } from '../../lib/auth'
import { ApiError, AUTH_TOKEN_KEY, SESSION_EXPIRED_EVENT, tokenStore } from '../../lib/apiClient'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(() => !!tokenStore.get())
  const [error, setError] = useState('')
  const accountRequest = useRef<AbortController | null>(null)
  const logout = useCallback(() => {
    accountRequest.current?.abort()
    tokenStore.clear()
    setUser(null)
    setError('')
    setLoading(false)
  }, [])
  const refresh = useCallback(async () => {
    const sessionToken = tokenStore.get()
    if (!sessionToken) { logout(); return }
    // An older /me response must not replace the account refreshed after verification.
    accountRequest.current?.abort()
    const controller = new AbortController()
    accountRequest.current = controller
    setLoading(true)
    setError('')
    try {
      const result = await authApi.me(controller.signal)
      if (!controller.signal.aborted && tokenStore.get() === sessionToken) setUser(saveUser(result.user))
    } catch (e) {
      if (controller.signal.aborted || tokenStore.get() !== sessionToken) return
      if (e instanceof ApiError && e.status === 401) logout()
      else setError(e instanceof Error ? e.message : 'Unable to load your account.')
    } finally {
      if (!controller.signal.aborted && tokenStore.get() === sessionToken) setLoading(false)
    }
  }, [logout])
  useEffect(() => {
    const controller = new AbortController()
    accountRequest.current?.abort()
    accountRequest.current = controller
    const sessionToken = tokenStore.get()
    if (sessionToken) {
      authApi.me(controller.signal).then(result => {
        if (!controller.signal.aborted && tokenStore.get() === sessionToken) {
          setUser(saveUser(result.user))
          setLoading(false)
        }
      }).catch(e => {
        if (controller.signal.aborted || tokenStore.get() !== sessionToken) return
        if (!(e instanceof ApiError && e.status === 401)) setError(e instanceof Error ? e.message : 'Unable to load your account.')
        setLoading(false)
      })
    }
    const onStorage = (event: StorageEvent) => { if (event.key === AUTH_TOKEN_KEY || event.key === null) void refresh() }
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    window.addEventListener('storage', onStorage)
    return () => { controller.abort(); accountRequest.current?.abort(); window.removeEventListener(SESSION_EXPIRED_EVENT, logout); window.removeEventListener('storage', onStorage) }
  }, [logout, refresh])
  const acceptSession = (response: AuthResponse) => {
    const nextUser = saveSession(response)
    accountRequest.current?.abort()
    setUser(nextUser)
    setError('')
    setLoading(false)
    return nextUser
  }
  return <AuthContext.Provider value={{ user, loading, error, acceptSession, logout, refresh }}>{children}</AuthContext.Provider>
}
