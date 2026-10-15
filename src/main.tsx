import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import AuthProvider from './features/auth/AuthProvider'
import ToastProvider from './components/ui/ToastProvider'
import Analytics from './components/Analytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Analytics />
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
