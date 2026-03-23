import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'darasaone-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'darasaone-web-app',
    },
  },
})

// Add session refresh listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Session token refreshed')
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out')
    // Clear any stored data
    localStorage.removeItem('darasaone-cart')
  }
})
