import React from 'react'
import CertificateGenerator from '../../../../components/certificates/CertificateGenerator'

const CertificateBanner = ({ isComplete, certificateIssued, user, courseId, course }) => {
  if (!isComplete || certificateIssued) return null

  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl text-center border">
      <div className="text-5xl mb-3">🏆</div>
      <h3 className="text-xl font-bold text-green-600">Course Completed!</h3>
      <p className="text-gray-600 mb-4">Congratulations! You've successfully completed this course.</p>
      <CertificateGenerator 
        studentId={user.id}
        courseId={courseId}
        studentName={user.user_metadata?.full_name}
        courseTitle={course?.title}
        teacherName={course?.profiles?.full_name}
      />
    </div>
  )
}

export default CertificateBanner