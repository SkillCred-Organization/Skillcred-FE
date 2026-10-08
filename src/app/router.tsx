import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '../App'
import AppLayout from '../components/layout/AppLayout'
import DashboardPage from '../features/dashboard/DashboardPage'

const stub = (title: string) => <h1 className="text-2xl font-semibold text-ink">{title}</h1>

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'projects', element: stub('Projects') },
      { path: 'certifications', element: stub('Certifications') },
      { path: 'skills', element: stub('Skills') },
      { path: 'achievements', element: stub('Achievements') },
      { path: 'verification', element: stub('Verification') },
      { path: 'share', element: stub('Share profile') },
      { path: 'settings', element: stub('Settings') },
      { path: 'profile', element: stub('Profile') },
    ],
  },
])