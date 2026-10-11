import { useAuth } from './authContext'

// The same shape as mockUser, but for the logged-in person
export function useDisplayUser() {
  const { user } = useAuth()
  const name = user?.fullName ?? ''
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
  return { name, initials, role: user?.role === 'admin' ? 'Admin' : 'Learner' }
}