import { Navigate, Outlet } from 'react-router-dom'
import { tokenStore } from '../lib/apiClient'

// Dev switch: put VITE_SKIP_AUTH=true in .env.local to open protected pages without logging in.
// Remove it once login works.
const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'

export default function RequireAuth() {
  if (!skipAuth && !tokenStore.get()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}