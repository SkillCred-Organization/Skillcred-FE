import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import EmptyState from '../ui/EmptyState'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={Compass}
          title="Page not found"
          message="The page you're looking for doesn't exist or has moved."
          action={
            <Link
              to="/"
              className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Go to the home page
            </Link>
          }
        />
      </div>
    </div>
  )
}