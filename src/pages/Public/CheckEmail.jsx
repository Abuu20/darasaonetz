import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Card, Button } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function CheckEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resendVerificationEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    const stateEmail = location.state?.email
    const storedEmail = localStorage.getItem('pendingVerificationEmail')
    
    if (stateEmail) {
      setEmail(stateEmail)
      localStorage.setItem('pendingVerificationEmail', stateEmail)
    } else if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [location])

  const handleResendEmail = async () => {
    if (!email) return
    
    setResending(true)
    setResendMessage('')
    
    try {
      const result = await resendVerificationEmail(email)
      if (result.success) {
        setResendMessage('Verification email sent! Please check your inbox.')
      } else {
        setResendMessage(result.error || 'Failed to send verification email.')
      }
    } catch (error) {
      setResendMessage('An error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const goToLogin = () => {
    localStorage.removeItem('pendingVerificationEmail')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <Card.Header>
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Check Your Email
              </h2>
              <p className="text-gray-600 mt-2">
                We've sent a verification link to
              </p>
              <p className="font-semibold text-blue-600 mt-1">
                {email || 'your email address'}
              </p>
            </div>
          </Card.Header>

          <Card.Body>
            <div className="text-center space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Click the link in the email to verify your account.
                  The link will expire in 24 hours.
                </p>
              </div>

              {resendMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resendMessage.includes('sent') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {resendMessage}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Click here to resend'}
                </button>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={goToLogin}
                  variant="outline" 
                  fullWidth 
                  className="mt-3"
                >
                  Go to Login
                </Button>
              </div>

              <div className="text-xs text-gray-400">
                <p>Check your spam folder if you don't see the email.</p>
                <p className="mt-1">
                  Need help? <a href="mailto:support@darasaone.com" className="text-blue-600">Contact Support</a>
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}