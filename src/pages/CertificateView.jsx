import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { certificateQueries } from '../supabase/queries/certificates'
import { Card, Button, Spinner } from '../components/ui'
import { useTheme } from '../context/ThemeContext'

export default function CertificateView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showError, showSuccess, showInfo } = useTheme()
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const certificateRef = useRef(null)

  useEffect(() => {
    fetchCertificate()
  }, [id])

  async function fetchCertificate() {
    try {
      const data = await certificateQueries.getCertificateById(id)
      setCertificate(data)
    } catch (error) {
      console.error('Error fetching certificate:', error)
      setError('Certificate not found')
    } finally {
      setLoading(false)
    }
  }

  async function downloadAsPDF() {
    if (!certificateRef.current) {
      showError('Certificate element not found')
      return
    }

    setDownloading(true)
    
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      
      try {
        await certificateQueries.incrementDownloadCount(certificate.id)
      } catch (err) {
        console.warn('Failed to increment download count:', err)
      }
      
      const element = certificateRef.current
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`certificate-${certificate.certificate_number}.pdf`)
      
    } catch (error) {
      console.error('Error downloading certificate:', error)
      showError('Failed to download certificate. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  async function shareCertificate() {
    try {
      try {
        await certificateQueries.incrementShareCount(certificate.id)
      } catch (err) {
        console.warn('Failed to increment share count:', err)
      }
      
      const shareData = {
        title: 'Course Completion Certificate',
        text: `I've successfully completed ${certificate.courses?.title}!`,
        url: window.location.href
      }
      
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showInfo('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing certificate:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Certificate Not Found</h2>
          <p className="text-gray-600 mb-6">The certificate you're looking for doesn't exist or has been revoked.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    )
  }

  const instructorName = certificate.courses?.profiles?.full_name || 'Darasaone Instructor'
  const courseTitle = certificate.courses?.title || 'Course'
  const studentName = certificate.profiles?.full_name || 'Student'

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Certificate Content */}
        <div 
          ref={certificateRef}
          className="bg-white shadow-2xl rounded-lg overflow-hidden"
          style={{ background: 'white' }}
        >
          {/* Decorative Border */}
          <div className="border-8 border-double border-blue-200 m-4 rounded-lg">
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
              <h1 className="text-4xl font-bold mb-2">Certificate of Completion</h1>
              <p className="text-blue-100 text-lg">This certifies that</p>
            </div>
            
            {/* Certificate Body */}
            <div className="p-12 text-center">
              <h2 className="text-5xl font-bold text-gray-800 mb-8">
                {studentName}
              </h2>
              
              <p className="text-xl text-gray-600 mb-4">
                has successfully completed the course
              </p>
              
              <h3 className="text-3xl font-bold text-blue-600 mb-8">
                {courseTitle}
              </h3>
              
              <div className="flex justify-center gap-12 mb-12">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                  <p className="font-semibold text-gray-700">
                    {new Date(certificate.issue_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Certificate Number</p>
                  <p className="font-mono text-sm font-semibold text-gray-700">
                    {certificate.certificate_number}
                  </p>
                </div>
              </div>
              
              {/* Signature Section */}
              <div className="border-t pt-8 mt-8">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <div className="border-b-2 border-gray-400 w-48 mb-2"></div>
                    <p className="text-sm font-semibold text-gray-700">{instructorName}</p>
                    <p className="text-xs text-gray-500">Course Instructor</p>
                  </div>
                  <div className="text-right">
                    <div className="border-b-2 border-gray-400 w-48 mb-2"></div>
                    <p className="text-sm font-semibold text-gray-700">Darasaone Platform</p>
                    <p className="text-xs text-gray-500">Authorized Signatory</p>
                  </div>
                </div>
              </div>
              
              {/* Verification */}
              <div className="mt-8 pt-8 border-t">
                <p className="text-xs text-gray-400 break-all">
                  Verify this certificate at: darasaone.com/verify/{certificate.verification_token}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4 flex-wrap">
          <Button 
            onClick={downloadAsPDF} 
            disabled={downloading}
            variant="primary"
          >
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button onClick={shareCertificate} variant="outline">
            Share Certificate
          </Button>
          <Button onClick={() => navigate('/student/my-courses')} variant="outline">
            Back to My Courses
          </Button>
        </div>
        
        {/* Verification Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Verification ID: {certificate.verification_token}
          </p>
        </div>
      </div>
    </div>
  )
}
