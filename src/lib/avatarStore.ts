import { useSyncExternalStore } from 'react'

const KEY = 'skillcred_avatar'
type Saved = { id: string; url: string } | null
const listeners = new Set<() => void>()

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

let saved: Saved = load()

// Call after an upload (url) or a removal (null)
export function setAvatar(userId: string | number, url: string | null) {
  saved = url ? { id: String(userId), url } : null
  try {
    if (saved) localStorage.setItem(KEY, JSON.stringify(saved))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Returns the photo only if it belongs to the logged-in user
export function useAvatarUrl(userId?: string | number): string | undefined {
  const current = useSyncExternalStore(subscribe, () => saved, () => null)
  return current && userId !== undefined && current.id === String(userId) ? current.url : undefined
}