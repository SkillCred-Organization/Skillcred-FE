import { createContext, useContext } from 'react'

export type ToastKind = 'success' | 'error'

export type ToastOptions = {
  actionLabel?: string
  onAction?: () => void
}

export type ToastApi = {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('ToastProvider is missing')
  return context
}