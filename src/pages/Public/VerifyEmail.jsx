import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Spinner } from '../../components/ui'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const hasVerified = useRef(false) // Prevent double verification

  const token = searchParams.get('token')

  useEffect(() => {
    // Only verify once
    if (token && !hasVerified.current) {
      hasVerified.current = true
      handleVerification()
    } else if (!token) {
      setVerifying(false)
      setError('No verification token provided')
    }
  }, [token])

  const handleVerification = async () => {
    setVerifying(true)
    setError('')
    
    try {
      const result = await verifyEmail(token)
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="text-center">
          <Card.Body className="py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </Card.Body>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="max-w-md text-center">
          <Card.Body className="py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </Card.Body>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="max-w-md">
        <Card.Header>
          <div className="text-center">
            <div className="text-5xl mb-3">❌</div>
            <h2 className="text-2xl font-bold">Verification Failed</h2>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
          <div className="text-center space-y-3">
            <Link to="/login" className="text-blue-600 hover:underline block">
              Back to Login
            </Link>
            <Link to="/register" className="text-gray-600 hover:underline block text-sm">
              Create a new account
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}