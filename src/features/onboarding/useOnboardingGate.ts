import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../../lib/api'
import { useAuth } from '../auth/authContext'

export const onboardingKey = (userId: string) => `onboarding_done:${userId}`

// Sends a new learner (no profile yet) to onboarding. Returns true while we're still checking.
export function useOnboardingGate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id ?? ''
  const needsCheck = user?.role === 'learner' && !!userId && !localStorage.getItem(onboardingKey(userId))
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!needsCheck) return
    let cancelled = false
    getProfile()
      .then(({ profile }) => {
        if (cancelled) return
        if (profile === null) {
          navigate('/onboarding', { replace: true })
        } else {
          localStorage.setItem(onboardingKey(userId), '1') // has a profile: never ask again
          setChecking(false)
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false) // if the check fails, let them in
      })
    return () => {
      cancelled = true
    }
  }, [needsCheck, userId, navigate])

  return needsCheck && checking
}