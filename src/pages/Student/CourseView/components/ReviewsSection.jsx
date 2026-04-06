import React from 'react'
import ReviewForm from '../../../../components/courses/ReviewForm'
import ReviewsList from '../../../../components/courses/ReviewsList'

const ReviewsSection = ({ 
  courseId, 
  hasReviewed, 
  enrollment, 
  onReviewSubmitted, 
  fetchCourseData,
  isMobile = false 
}) => {
  return (
    <div className={`${isMobile ? '' : 'bg-white dark:bg-gray-800 rounded-xl shadow-sm'}`}>
      {!isMobile && (
        <div className="p-5 border-b">
          <h2 className="text-xl font-bold">⭐ Course Reviews</h2>
          <p className="text-sm text-gray-500">What other students are saying</p>
        </div>
      )}
      <div className={!isMobile ? 'p-5' : ''}>
        {!hasReviewed && enrollment?.progress > 50 && (
          <div className={`${isMobile ? 'mb-4' : 'mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'}`}>
            <ReviewForm courseId={courseId} onReviewSubmitted={onReviewSubmitted} />
          </div>
        )}
        <ReviewsList courseId={courseId} />
      </div>
    </div>
  )
}

export default ReviewsSection