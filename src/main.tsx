import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import AuthProvider from './features/auth/AuthProvider'
import ToastProvider from './components/ui/ToastProvider'
import Analytics from './components/Analytics'
import ErrorBoundary from './components/ErrorBoundary'
import BillingProvider from './features/billing/BillingProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Analytics />
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BillingProvider><App /></BillingProvider>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
