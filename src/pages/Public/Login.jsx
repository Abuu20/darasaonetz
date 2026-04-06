import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next' 
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input, Button, Card } from '../../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const { login, resendVerificationEmail } = useAuth()
  const { showError, showSuccess } = useTheme()
  const { t } = useTranslation() 
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('email_verified, role')
            .eq('id', session.user.id)
            .single()
          
          if (!error && profile?.email_verified) {
            const role = profile.role || 'student'
            if (role === 'admin') navigate('/admin')
            else if (role === 'teacher') navigate('/teacher')
            else navigate('/student')
            return
          } else if (profile && !profile.email_verified) {
            await supabase.auth.signOut()
          }
        }
      } catch (err) {
        // Silent fail - user not logged in or error
      } finally {
        setCheckingSession(false)
      }
    }
    
    checkSession()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsVerification(false)
    setResendSuccess('')

    if (!formData.email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        showSuccess('Login successful! Redirecting...')
        
        const { data: { session } } = await supabase.auth.getSession()
        let role = 'student'
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          role = profile?.role || 'student'
        }
        
        setTimeout(() => {
          if (role === 'admin') navigate('/admin')
          else if (role === 'teacher') navigate('/teacher')
          else navigate('/student')
        }, 1000)
      } else {
        if (result.needsVerification) {
          setNeedsVerification(true)
          setUnverifiedEmail(result.email || formData.email)
          setError(result.error || 'Please verify your email before logging in.')
        } else {
          setError(result.error || 'Invalid email or password.')
        }
        showError(result.error || 'Login failed')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      showError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return
    
    setResending(true)
    setResendSuccess('')
    setError('')
    
    try {
      const result = await resendVerificationEmail(unverifiedEmail)
      if (result.success) {
        setResendSuccess('Verification email sent! Please check your inbox.')
        showSuccess('Verification email sent!')
      } else {
        setError(result.error || 'Failed to send verification email')
        showError(result.error || 'Failed to send verification email')
      }
    } catch (err) {
      setError('An error occurred')
      showError('Failed to send verification email')
    } finally {
      setResending(false)
    }
  }

  // Always render the form, don't block on session check
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <Card.Header>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white">
              Welcome Back
              <span className="text-blue-600 dark:text-blue-400"> to Darasaone</span>
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
              Sign in to continue your learning journey
            </p>
          </Card.Header>

          <Card.Body>
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {resendSuccess && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {resendSuccess}
              </div>
            )}

            {needsVerification && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 text-xl">📧</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                      Email Not Verified
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                      Please check your inbox for the verification link. 
                      Didn't receive it? Click below to resend.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mr-2 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    disabled={loading} 
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth 
                disabled={loading} 
                className="py-3 text-base font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>
                By signing in, you agree to our{' '}
                <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}