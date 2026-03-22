import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { Spinner } from '../ui'

export default function ProtectedRoute({ role }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Try to get from metadata first
        let role = user.user_metadata?.role || 'student'
        
        // Then try to get from profiles
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          
          if (profile?.role) {
            role = profile.role
          }
        } catch (profileError) {
          console.warn('Could not fetch profile')
        }
        
        setUserRole(role)
      }
      
    } catch (error) {
      console.error('Auth error:', error)
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

  // If no role specified, this is a public route
  if (!role) {
    return <Outlet />
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (role && userRole !== role) {
    console.log(`Access denied: required ${role}, but user is ${userRole}`)
    
    // Redirect to appropriate dashboard based on actual role
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />
    if (userRole === 'student') return <Navigate to="/student" replace />
    
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
