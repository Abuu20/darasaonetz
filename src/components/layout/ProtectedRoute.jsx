import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../ui'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ role }) {
  const location = useLocation()
  const { user, profile, loading, role: userRole, isAuthenticated } = useAuth()

  // Wait for both user and role to be loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Check if email is verified - THIS IS THE KEY ADDITION
  if (profile && !profile.email_verified) {
    // Redirect to verification page with message
    return <Navigate to="/verify-email" state={{ email: user.email }} replace />
  }

  // If role is still loading, show spinner
  if (role && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Check role access
  if (role && userRole !== role) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }

  return <Outlet />
}