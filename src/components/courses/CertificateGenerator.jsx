import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { Button, Spinner } from '../ui'

export default function CertificateGenerator({ 
  studentId, 
  courseId, 
  studentName, 
  courseTitle, 
  teacherName,
  onCertificateGenerated 
}) {
  const [generating, setGenerating] = useState(false)
  const [hasCertificate, setHasCertificate] = useState(false)
  const [certificateUrl, setCertificateUrl] = useState(null)
  const [certificateId, setCertificateId] = useState(null)

  useEffect(() => {
    checkExistingCertificate()
  }, [studentId, courseId])

  async function checkExistingCertificate() {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, certificate_url, issued_at')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle()

      if (data && !error) {
        setHasCertificate(true)
        setCertificateId(data.id)
        setCertificateUrl(data.certificate_url)
      }
    } catch (error) {
      console.error('Error checking certificate:', error)
    }
  }

  async function generateCertificate() {
    setGenerating(true)

    try {
      // Create certificate record
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .insert({
          student_id: studentId,
          course_id: courseId,
          student_name: studentName,
          course_title: courseTitle,
          teacher_name: teacherName,
          issued_at: new Date().toISOString(),
          certificate_number: generateCertificateNumber()
        })
        .select()
        .single()

      if (certError) throw certError

      setCertificateId(certData.id)
      
      // Generate HTML certificate
      const htmlContent = generateCertificateHTML({
        studentName,
        courseTitle,
        teacherName,
        issuedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        certificateNumber: certData.certificate_number
      })

      // Convert HTML to PDF (using html2pdf or similar)
      // For now, we'll create a downloadable HTML version
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // Upload to Supabase Storage
      const fileName = `certificates/${studentId}/${courseId}/certificate.html`
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, blob, { 
          contentType: 'text/html',
          upsert: true 
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName)

      // Update certificate with URL
      await supabase
        .from('certificates')
        .update({ certificate_url: publicUrl })
        .eq('id', certData.id)

      setCertificateUrl(publicUrl)
      setHasCertificate(true)
      
      if (onCertificateGenerated) {
        onCertificateGenerated(certData)
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          type: 'achievement',
          title: 'Certificate Earned! 🎓',
          message: `Congratulations! You've earned a certificate for completing "${courseTitle}".`,
          metadata: { certificate_id: certData.id, course_id: courseId }
        })

    } catch (error) {
      console.error('Error generating certificate:', error)
      alert('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function generateCertificateNumber() {
    const prefix = 'CERT'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  function generateCertificateHTML({ studentName, courseTitle, teacherName, issuedDate, certificateNumber }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Completion - ${studentName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .certificate {
      width: 800px;
      background: white;
      padding: 40px;
      border: 20px solid #fbbf24;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      background: linear-gradient(to bottom, #fff, #fef9e8);
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #fbbf24;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .title {
      font-size: 48px;
      color: #d97706;
      font-weight: bold;
      margin-bottom: 10px;
      font-family: 'Times New Roman', serif;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      display: inline-block;
      padding: 5px 20px;
    }
    
    .content {
      text-align: center;
      margin: 40px 0;
    }
    
    .awarded-to {
      font-size: 16px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .student-name {
      font-size: 42px;
      color: #2c3e50;
      font-weight: bold;
      margin: 20px 0;
      font-family: 'Times New Roman', serif;
      border-bottom: 2px dotted #fbbf24;
      display: inline-block;
      padding: 0 20px;
    }
    
    .course-name {
      font-size: 28px;
      color: #d97706;
      margin: 20px 0;
      font-weight: bold;
    }
    
    .description {
      font-size: 14px;
      color: #666;
      margin: 20px 0;
      line-height: 1.6;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature {
      text-align: center;
    }
    
    .signature-line {
      width: 200px;
      border-top: 2px solid #333;
      margin: 10px 0;
    }
    
    .signature-name {
      font-size: 14px;
      font-weight: bold;
    }
    
    .signature-title {
      font-size: 12px;
      color: #666;
    }
    
    .date {
      text-align: center;
    }
    
    .date-text {
      font-size: 14px;
      color: #666;
    }
    
    .certificate-number {
      font-size: 10px;
      color: #999;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    
    .seal {
      position: absolute;
      bottom: 80px;
      right: 60px;
      width: 80px;
      height: 80px;
      border: 3px solid #d97706;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #d97706;
      font-weight: bold;
      text-align: center;
      transform: rotate(-15deg);
      background: rgba(249, 115, 22, 0.1);
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        border: 20px solid #fbbf24;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="title">Certificate of Completion</div>
      <div class="subtitle">This certificate is proudly presented to</div>
    </div>
    
    <div class="content">
      <div class="awarded-to">Awarded to</div>
      <div class="student-name">${studentName}</div>
      <div class="course-name">${courseTitle}</div>
      <div class="description">
        for successfully completing the course requirements with dedication and excellence.
      </div>
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">${teacherName}</div>
        <div class="signature-title">Course Instructor</div>
      </div>
      <div class="date">
        <div class="date-text">Issued on ${issuedDate}</div>
      </div>
    </div>
    
    <div class="certificate-number">
      Certificate ID: ${certificateNumber}
    </div>
    
    <div class="seal">
      DARASAONE
    </div>
  </div>
  
  <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #d97706; color: white; border: none; border-radius: 5px; cursor: pointer;">
      🖨️ Print Certificate
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
      ✖ Close
    </button>
  </div>
</body>
</html>`
  }

  async function downloadCertificate() {
    if (!certificateUrl) return
    
    window.open(certificateUrl, '_blank')
  }

  return (
    <div className="space-y-4">
      {hasCertificate ? (
        <div>
          <Button 
            variant="primary" 
            size="lg"
            onClick={downloadCertificate}
            className="w-full md:w-auto"
          >
            🎓 View & Download Certificate
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Click to view your certificate. You can print or save it as PDF.
          </p>
        </div>
      ) : (
        <Button
          variant="success"
          size="lg"
          onClick={generateCertificate}
          disabled={generating}
          className="w-full md:w-auto"
        >
          {generating ? (
            <>
              <Spinner size="sm" color="white" />
              <span className="ml-2">Generating Certificate...</span>
            </>
          ) : (
            '🎓 Generate Certificate'
          )}
        </Button>
      )}
    </div>
  )
}
