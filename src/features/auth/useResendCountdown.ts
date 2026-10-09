import { useEffect, useState } from 'react'
export function useResendCountdown(initialDeadline = 0) {
  const [deadline, setDeadline] = useState(initialDeadline)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!deadline) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [deadline])
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))
  return { remaining, restart: () => { const start = Date.now(); setNow(start); setDeadline(start + 45000) } }
}
