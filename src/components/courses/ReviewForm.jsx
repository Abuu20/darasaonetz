import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui'
import RatingStars from '../ui/RatingStars'

export default function ReviewForm({ courseId, onReviewSubmitted }) {
  const { user, isAuthenticated } = useAuth()
  const { showError, showSuccess } = useTheme()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      showError('Please login to leave a review')
      return
    }
    
    if (rating === 0) {
      showError('Please select a rating')
      return
    }
    
    setSubmitting(true)
    
    try {
      const { supabase } = await import('../../supabase/client')
      
      const { error } = await supabase
        .from('course_reviews')
        .upsert({
          course_id: courseId,
          student_id: user.id,
          rating,
          comment
        }, {
          onConflict: 'course_id, student_id'
        })
      
      if (error) throw error
      
      showSuccess('Review submitted successfully!')
      setRating(0)
      setComment('')
      setShowForm(false)
      
      if (onReviewSubmitted) onReviewSubmitted()
      
    } catch (error) {
      console.error('Error submitting review:', error)
      showError('Failed to submit review: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-left p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">✍️</span>
            <span className="text-gray-600 dark:text-gray-300">
              Write a review for this course
            </span>
          </div>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Your Rating
            </label>
            <RatingStars rating={rating} onRate={setRating} size="lg" />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Share your experience with this course..."
              disabled={submitting}
            />
          </div>
          
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
