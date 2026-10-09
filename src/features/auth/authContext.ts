import { createContext, useContext } from 'react'
import type { AuthResponse, AuthUser } from '../../lib/auth'
type AuthContextValue = {
  user: AuthUser | null; loading: boolean; error: string
  acceptSession: (response: AuthResponse) => AuthUser
  logout: () => void
  refresh: () => Promise<void>
}
export const AuthContext = createContext<AuthContextValue | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider is missing')
  return context
}
