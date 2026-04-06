import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next' 
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input, Button, Card, Select } from '../../components/ui'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showError } = useTheme()
  const { t } = useTranslation() 
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('📝 [DEBUG] Register form submitted')
    setLoading(true)
    setError('')

    if (!formData.fullName.trim()) {
      console.log('❌ [DEBUG] Validation failed: No full name')
      setError('Please enter your full name')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      console.log('❌ [DEBUG] Validation failed: No email')
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      console.log('❌ [DEBUG] Validation failed: Passwords do not match')
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      console.log('❌ [DEBUG] Validation failed: Password too short')
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    console.log('✅ [DEBUG] Validation passed, calling register function')
    console.log('📝 [DEBUG] Register data:', {
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role
    })

    try {
      const result = await register(formData.email, formData.password, {
        full_name: formData.fullName,
        role: formData.role
      })
      
      console.log('📝 [DEBUG] Register result:', result)
      
      if (result && result.success) {
        console.log('✅ [DEBUG] Registration successful, navigating to check-email')
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'student'
        })
        
        navigate('/check-email', { 
          state: { email: formData.email }
        })
      } else {
        const errorMsg = result?.error || 'Registration failed. Please try again.'
        console.log('❌ [DEBUG] Registration failed:', errorMsg)
        setError(errorMsg)
        showError(errorMsg)
      }
    } catch (error) {
      console.error('❌ [DEBUG] Registration exception:', error)
      const errorMsg = error.message || 'Registration failed. Please try again.'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
      console.log('📝 [DEBUG] Register function completed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <Card.Header>
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900">
              Create Account
              <span className="text-blue-600"> on Darasaone</span>
            </h2>
            <p className="text-center text-gray-600 mt-2 text-sm md:text-base">
              Join our learning community
            </p>
          </Card.Header>

          <Card.Body>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <Input
                label="Full Name"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
                required
                disabled={loading}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Create a password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <Select
                label="I want to"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                options={[
                  { value: 'student', label: 'Learn as a Student' },
                  { value: 'teacher', label: 'Teach as a Teacher' }
                ]}
                disabled={loading}
              />

              <Button type="submit" variant="primary" fullWidth disabled={loading} className="py-3 text-base">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm md:text-base">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}