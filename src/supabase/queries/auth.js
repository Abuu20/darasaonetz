import { supabase } from '../client'

// User profile queries
export const profileQueries = {
  // Get user profile by ID
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get user profile by email
  getProfileByEmail: async (email) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get user role
  getUserRole: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data?.role
  },

  // Check if user is admin
  isAdmin: async (userId) => {
    const role = await profileQueries.getUserRole(userId)
    return role === 'admin'
  },

  // Check if user is teacher
  isTeacher: async (userId) => {
    const role = await profileQueries.getUserRole(userId)
    return role === 'teacher'
  },

  // Check if user is student
  isStudent: async (userId) => {
    const role = await profileQueries.getUserRole(userId)
    return role === 'student'
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Search users
  searchUsers: async (searchTerm) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Update user role (admin only)
  updateUserRole: async (userId, newRole) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
    return true
  }
}

// Authentication helper functions
export const authHelpers = {
  // Get current user with profile
  getCurrentUserWithProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const profile = await profileQueries.getProfile(user.id)
    return { ...user, profile }
  },

  // Sign up with profile creation
  signUpWithProfile: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  },

  // Reset password
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw error
    return true
  },

  // Update password
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    return true
  },

  // Update email
  updateEmail: async (newEmail) => {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })
    
    if (error) throw error
    return true
  },

  // Get session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Refresh session
  refreshSession: async () => {
    const { data: { session } } = await supabase.auth.refreshSession()
    return session
  }
}
