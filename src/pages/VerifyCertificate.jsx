import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { certificateQueries } from './../supabase/queries/certificates'
import { Card, Button, Spinner } from '../components/ui'

export default function VerifyCertificate() {
  const { token } = useParams()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    verifyCertificate()
  }, [token])

  async function verifyCertificate() {
    try {
      const data = await certificateQueries.verifyCertificate(token)
      if (data) {
        setCertificate(data)
      } else {
        setError('Certificate not found or has been revoked')
      }
    } catch (error) {
      console.error('Error verifying certificate:', error)
      setError('Failed to verify certificate')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-center">
            {certificate ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-green-600 mb-2">Valid Certificate</h1>
                <p className="text-gray-600 mb-4">
                  This is a valid certificate issued by Darasaone
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <p className="mb-2">
                    <span className="font-semibold">Recipient:</span> {certificate.profiles?.full_name}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Course:</span> {certificate.courses?.title}
                  </p>
                  <p className="mb-2">
                    <span className="font-semibold">Issue Date:</span> {new Date(certificate.issue_date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold">Certificate ID:</span> {certificate.certificate_number}
                  </p>
                </div>
                
                <Link to={`/certificate/${certificate.id}`}>
                  <Button variant="primary">View Full Certificate</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Certificate</h1>
                <p className="text-gray-600 mb-6">{error || 'This certificate could not be verified'}</p>
                <Link to="/">
                  <Button variant="primary">Go Home</Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
