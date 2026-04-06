import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import emailJSService from '../services/emailjsService' // Add this

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

// Add this helper function
const generateVerificationToken = () => {
  return 'vt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let isMounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        console.log('Auth event:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed successfully')
          setSessionExpired(false)
        }
        
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setSessionExpired(true)
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      console.log('Initial session:', session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      
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

  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && user) {
        console.log('Session expired during active session')
        setSessionExpired(true)
        await logout()
        window.location.href = '/login?expired=true'
      }
    }, 5 * 60 * 1000)
    
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

  // Updated register with email verification
  const register = async (email, password, userData) => {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }

      // Generate verification token
      const verificationToken = generateVerificationToken()
      const tokenExpiresAt = new Date()
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24)

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: {
            full_name: userData.full_name,
            role: userData.role || 'student'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (signUpError) {
        return { success: false, error: signUpError.message }
      }
      
      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' }
      }

      // Wait for profile to be created
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update profile with verification token
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_token: verificationToken,
          verification_token_expires_at: tokenExpiresAt.toISOString(),
          email_verified: false
        })
        .eq('id', authData.user.id)

      if (updateError) {
        // Try insert if update fails
        await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: userData.full_name,
            role: userData.role || 'student',
            verification_token: verificationToken,
            verification_token_expires_at: tokenExpiresAt.toISOString(),
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      // Send verification email
      try {
        await emailJSService.sendVerificationEmail(email, userData.full_name, verificationToken)
      } catch (emailError) {
        // Continue even if email fails
      }

      // Sign out immediately
      await supabase.auth.signOut()

      return { 
        success: true, 
        requiresVerification: true,
        message: 'Account created! Please check your email to verify your account.'
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Add verifyEmail function
  const verifyEmail = async (token) => {
    try {
      const decodedToken = decodeURIComponent(token)
      
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('verification_token', decodedToken)
        .maybeSingle()

      if (findError || !profile) {
        return { success: false, error: 'Invalid or expired verification link' }
      }

      const tokenExpiry = new Date(profile.verification_token_expires_at)
      if (tokenExpiry < new Date()) {
        return { success: false, error: 'Verification link has expired' }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email_verified: true,
          verification_token: null,
          verification_token_expires_at: null
        })
        .eq('id', profile.id)

      if (profileError) {
        return { success: false, error: 'Failed to update profile' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Add resendVerificationEmail function
  const resendVerificationEmail = async (email) => {
    try {
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (findError || !profile) {
        return { success: false, error: 'User not found' }
      }

      if (profile.email_verified) {
        return { success: false, error: 'Email already verified' }
      }

      const verificationToken = generateVerificationToken()
      const tokenExpiresAt = new Date()
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24)

      await supabase
        .from('profiles')
        .update({
          verification_token: verificationToken,
          verification_token_expires_at: tokenExpiresAt.toISOString()
        })
        .eq('id', profile.id)

      await emailJSService.sendVerificationEmail(email, profile.full_name, verificationToken)

      return { success: true, message: 'Verification email sent!' }
    } catch (error) {
      return { success: false, error: error.message }
    }
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
    verifyEmail,
    resendVerificationEmail,
    isAuthenticated: !!user && !sessionExpired,
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student',
    role: profile?.role,
    emailVerified: profile?.email_verified === true
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext