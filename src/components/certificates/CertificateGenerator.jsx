import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { certificateQueries } from '../../supabase/queries/certificates'
import { Button, Spinner } from '../ui'

export default function CertificateGenerator({ studentId, courseId, studentName, courseTitle, teacherName }) {
  const navigate = useNavigate()
  const [generating, setGenerating] = useState(false)
  const [certificate, setCertificate] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCertificate()
  }, [studentId, courseId])

  async function checkCertificate() {
    try {
      const hasCert = await certificateQueries.hasCertificate(studentId, courseId)
      if (hasCert) {
        const certificates = await certificateQueries.getStudentCertificates(studentId)
        const existing = certificates.find(c => c.course_id === courseId)
        setCertificate(existing)
      }
    } catch (error) {
      console.error('Error checking certificate:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    
    try {
      const newCert = await certificateQueries.issueCertificate(studentId, courseId)
      setCertificate(newCert)
      
      // Show success message
      alert('🎓 Certificate generated successfully!')
      
      // Navigate to view certificate
      navigate(`/certificate/${newCert.id}`)
      
    } catch (error) {
      console.error('Error generating certificate:', error)
      setError('Failed to generate certificate')
      alert('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleViewCertificate() {
    if (certificate) {
      navigate(`/certificate/${certificate.id}`)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  if (certificate) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🎓</div>
        <p className="text-green-600 font-semibold mb-2">Certificate Issued!</p>
        <p className="text-xs text-gray-500 mb-4 font-mono">
          #{certificate.certificate_number}
        </p>
        <Button onClick={handleViewCertificate} variant="primary">
          View Certificate
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="text-5xl mb-4">📜</div>
      <h3 className="text-lg font-semibold mb-2">Congratulations!</h3>
      <p className="text-gray-600 mb-4">
        You've completed {courseTitle}! Get your certificate of completion.
      </p>
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
      <Button 
        onClick={handleGenerate} 
        disabled={generating}
        variant="primary"
      >
        {generating ? 'Generating...' : 'Get Certificate'}
      </Button>
    </div>
  )
}
