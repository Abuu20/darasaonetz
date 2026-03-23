import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui'

export default function NotFound() {
  const location = useLocation()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page <span className="font-mono text-sm">{location.pathname}</span> does not exist.
        </p>
        <div className="space-y-3">
          <Link to="/">
            <Button variant="primary" fullWidth>
              Go to Homepage
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" fullWidth>
              Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
