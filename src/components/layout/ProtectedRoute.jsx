import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { Spinner } from '../ui'

export default function ProtectedRoute({ role }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        // No session, redirect to login
        setLoading(false)
        return
      }
      
      setUser(session.user)
      
      // Get user role from profile
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        
        if (profileError) throw profileError
        
        const role = profile?.role || session.user.user_metadata?.role || 'student'
        setUserRole(role)
        
      } catch (profileError) {
        console.warn('Could not fetch profile, using metadata role')
        const role = session.user.user_metadata?.role || 'student'
        setUserRole(role)
      }
      
    } catch (error) {
      console.error('Auth error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // If error or no user, redirect to login
  if (error || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (role && userRole !== role) {
    // Redirect to appropriate dashboard based on actual role
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />
    if (userRole === 'student') return <Navigate to="/student" replace />
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
