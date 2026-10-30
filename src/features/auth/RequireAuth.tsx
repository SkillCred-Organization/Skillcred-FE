import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'
import AuthPageLayout from '../../components/pages/AuthPageLayout'
import Button from '../../components/ui/Button'
export default function RequireAuth({ role }: { role?: 'learner' | 'admin' }) {
  const { user, loading, error, refresh, logout } = useAuth()
  const location = useLocation()
  if (loading || error) return <AuthPageLayout><section className="auth-panel auth-status"><h1>{loading ? 'Loading your account…' : 'Unable to load your account'}</h1>{error && <><p className="auth-description">{error}</p><Button className="auth-submit" onClick={() => void refresh()}>Try again</Button><button className="auth-back" onClick={logout}>Back to log in</button></>}</section></AuthPageLayout>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  return <Outlet />
}
