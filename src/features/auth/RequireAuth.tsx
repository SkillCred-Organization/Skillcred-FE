import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'
import AuthPageLayout from '../../components/pages/AuthPageLayout'
import Button from '../../components/ui/Button'
// verified: also send learners who haven't confirmed their email to the app, which asks them to verify
export default function RequireAuth({ role, verified }: { role?: 'learner' | 'admin'; verified?: boolean }) {
  const { user, loading, error, refresh, logout } = useAuth()
  const location = useLocation()
  if (loading || error) return <AuthPageLayout><section className="auth-panel auth-status"><h1>{loading ? 'Loading your account…' : 'Unable to load your account'}</h1>{error && <><p className="auth-description">{error}</p><Button className="auth-submit" onClick={() => void refresh()}>Try again</Button><button className="auth-back" onClick={logout}>Back to log in</button></>}</section></AuthPageLayout>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/app/dashboard'} replace />
  if (verified && !user.emailVerified) return <Navigate to="/app/dashboard" replace />
  return <Outlet />
}
