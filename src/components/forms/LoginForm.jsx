import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { validateLogin } from '../../utils/validators'
import { Input, Button, Card } from '../ui'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showError, showSuccess } = useTheme()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateLogin(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    
    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        showSuccess('Login successful! Redirecting...')
        
        // Get user role from auth context or result
        const role = result.data?.user?.user_metadata?.role || 'student'
        
        // Redirect based on role
        setTimeout(() => {
          if (role === 'admin') navigate('/admin')
          else if (role === 'teacher') navigate('/teacher')
          else navigate('/student')
        }, 1000)
      } else {
        showError(result.error || 'Login failed')
        setErrors({ general: result.error })
      }
    } catch (error) {
      showError('An unexpected error occurred')
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }

  return (
    <Card className="max-w-md w-full">
      <Card.Header>
        <h2 className="text-2xl font-bold text-center">
          Welcome <span className="text-blue-600">Back</span>
        </h2>
        <p className="text-center text-gray-600 mt-2">
          Sign in to continue to Darasaone
        </p>
      </Card.Header>

      <Card.Body>
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            error={errors.email}
            required
            disabled={loading}
            autoComplete="email"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </Card.Body>

      <Card.Footer className="text-center text-sm text-gray-500">
        <p>Demo accounts:</p>
        <p>student@example.com / password123</p>
        <p>teacher@example.com / password123</p>
        <p>admin@example.com / password123</p>
      </Card.Footer>
    </Card>
  )
}
