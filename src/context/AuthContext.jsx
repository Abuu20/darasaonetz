import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let isMounted = true

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        console.log('Auth event:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Handle token refresh events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed successfully')
          setSessionExpired(false)
        }
        
        // Handle token expiration
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setSessionExpired(true)
          // Show toast notification
          if (window.__toast) {
            window.__toast('Session expired. Please login again.', 'warning')
          }
        }
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      console.log('Initial session:', session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      
      // Check if session is expired
      if (session?.expires_at && session.expires_at < Date.now() / 1000) {
        console.log('Session expired on load')
        setSessionExpired(true)
        supabase.auth.signOut()
      }
      
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Check session health periodically (every 5 minutes)
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If session is missing but user exists, token expired
      if (!session && user) {
        console.log('Session expired during active session')
        setSessionExpired(true)
        // Auto logout
        await logout()
        window.location.href = '/login?expired=true'
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
    
    return () => clearInterval(interval)
  }, [user])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) return { success: false, error: error.message }
    setSessionExpired(false)
    return { success: true, data }
  }

  const register = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
    })
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, error: error.message }
    setUser(null)
    setProfile(null)
    setSession(null)
    setSessionExpired(false)
    return { success: true }
  }

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) return { success: false, error: error.message }
    setSession(data.session)
    setUser(data.session?.user ?? null)
    setSessionExpired(false)
    return { success: true, data }
  }

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user' }
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (error) return { success: false, error: error.message }
    setProfile(prev => ({ ...prev, ...updates }))
    return { success: true }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    sessionExpired,
    login,
    register,
    logout,
    refreshSession,
    updateProfile,
    isAuthenticated: !!user && !sessionExpired,
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student',
    role: profile?.role
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext