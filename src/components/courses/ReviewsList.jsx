import { useState, useEffect } from 'react'
import { Avatar } from '../ui'
import RatingStars from '../ui/RatingStars'

export default function ReviewsList({ courseId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  async function fetchReviews() {
    try {
      const { supabase } = await import('../../supabase/client')
      
      const { data, error } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles:student_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setReviews(data || [])
      
      // Calculate summary
      const total = data?.length || 0
      const sum = data?.reduce((acc, r) => acc + r.rating, 0) || 0
      const avg = total > 0 ? sum / total : 0
      
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      data?.forEach(review => {
        distribution[review.rating]++
      })
      
      setSummary({
        averageRating: avg,
        totalReviews: total,
        ratingDistribution: distribution
      })
      
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-4xl mb-2">⭐</p>
        <p>No reviews yet. Be the first to review this course!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {summary.averageRating.toFixed(1)}
            </div>
            <RatingStars rating={summary.averageRating} readonly size="md" />
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = summary.ratingDistribution[rating]
              const percentage = summary.totalReviews > 0 
                ? (count / summary.totalReviews) * 100 
                : 0
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <div className="w-8 text-sm text-gray-600 dark:text-gray-400">
                    {rating} ★
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-gray-500 dark:text-gray-400">
                    {count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="border-b dark:border-gray-700 pb-4 last:border-0">
            <div className="flex items-start gap-3">
              <Avatar 
                src={review.profiles?.avatar_url} 
                alt={review.profiles?.full_name}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {review.profiles?.full_name || 'Anonymous'}
                    </p>
                    <RatingStars rating={review.rating} readonly size="sm" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {review.comment && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {review.comment}
                  </p>
                )}
                
                {review.teacher_response && (
                  <div className="mt-3 ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                      Teacher Response:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {review.teacher_response}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(review.teacher_response_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
