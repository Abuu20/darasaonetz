import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import RatingStars from '../ui/RatingStars'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function CourseCard({ course, progress, enrollmentId, isTeacher = false, isEnrolled, onEnroll, onAddToCart }) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { showSuccess, showError } = useTheme()
  
  // Handle case where course might be null
  if (!course) {
    return null
  }
  
  const courseData = course.courses || course
  const priceValue = parseFloat(courseData.price) || 0
  const isPaid = priceValue > 0
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [realProgress, setRealProgress] = useState(0)
  
  const enrolled = isEnrolled !== undefined ? isEnrolled : (progress !== undefined)
  
  // Get total lessons count safely
  const totalLessons = courseData.lessons?.count || courseData.lessons?.length || 0
  
  useEffect(() => {
    if (user && enrolled && courseData.id) {
      fetchEnrollmentProgress()
    }
  }, [user, courseData.id, enrolled])

  async function fetchEnrollmentProgress() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('progress, completed_lessons')
        .eq('student_id', user.id)
        .eq('course_id', courseData.id)
        .maybeSingle()
      
      if (error) throw error
      if (data) setRealProgress(data.progress || 0)
    } catch (error) {
      console.error('Error fetching enrollment progress:', error)
    }
  }

  useEffect(() => {
    if (user && !isTeacher && courseData.id) {
      checkWishlistStatus()
    }
  }, [user, courseData.id, isTeacher])

  async function checkWishlistStatus() {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseData.id)
        .maybeSingle()
      if (error) throw error
      setIsInWishlist(!!data)
    } catch (error) {
      console.error('Error checking wishlist:', error)
    }
  }

  async function toggleWishlist(e) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      showError('Please login to add to wishlist')
      return
    }

    setWishlistLoading(true)

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseData.id)
        if (error) throw error
        setIsInWishlist(false)
        showSuccess('Removed from wishlist')
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            student_id: user.id,
            course_id: courseData.id
          })
        if (error) throw error
        setIsInWishlist(true)
        showSuccess('Added to wishlist')
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      showError('Failed to update wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleAddToCartClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(courseData)
    } else {
      addToCart(courseData)
    }
    showSuccess(`${courseData.title} added to cart!`)
  }

  const handleEnrollClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onEnroll) {
      onEnroll(courseData.id)
    }
  }

  const displayProgress = enrolled ? realProgress : 0
  const completedLessonsCount = Math.round((displayProgress / 100) * totalLessons)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 relative">
      {/* Wishlist Button */}
      {!isTeacher && user && (
        <button
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md transition-all hover:scale-110 ${
            isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}

      {/* Thumbnail */}
      <Link to={`/student/course-details/${courseData.id}`}>
        <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden group">
          {courseData.thumbnail_url ? (
            <img 
              src={courseData.thumbnail_url} 
              alt={courseData.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-4xl">
              📚
            </div>
          )}
          {enrolled && displayProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-300">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          )}
          {(courseData.average_rating > 0 || courseData.review_count > 0) && (
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <RatingStars rating={courseData.average_rating} readonly size="sm" />
              <span className="text-xs text-white ml-1">
                ({courseData.review_count})
              </span>
            </div>
          )}
          {courseData.price > 0 ? (
            <div className="absolute bottom-3 left-3 bg-blue-600 rounded-full px-3 py-1">
              <span className="text-white text-xs font-semibold">TZS {priceValue.toLocaleString()}</span>
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 bg-green-600 rounded-full px-3 py-1">
              <span className="text-white text-xs font-semibold">Free</span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Content */}
      <div className="p-4">
        <Link to={`/student/course-details/${courseData.id}`}>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1 hover:text-blue-600 transition">
            {courseData.title}
          </h3>
        </Link>
        
        {!isTeacher && (courseData.average_rating > 0 || courseData.review_count > 0) && (
          <div className="flex items-center gap-2 mb-2">
            <RatingStars rating={courseData.average_rating} readonly size="sm" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({courseData.review_count})
            </span>
          </div>
        )}
        
        {!isTeacher && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {courseData.level} • {courseData.profiles?.full_name?.split(' ')[0] || 'Instructor'}
          </p>
        )}

        {isTeacher && (
          <div className="flex gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded ${
              courseData.status === 'published' ? 'bg-green-100 text-green-700' :
              courseData.status === 'pending' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {courseData.status}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {totalLessons} lessons
            </span>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {courseData.description}
        </p>
        
        <div className="flex items-center justify-between">
          {!isTeacher && enrolled ? (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {displayProgress}% Complete
              </span>
              {totalLessons > 0 && (
                <span className="text-xs text-gray-500">
                  {completedLessonsCount}/{totalLessons} lessons
                </span>
              )}
            </div>
          ) : !isTeacher && (
            <div>
              {isPaid ? (
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  TZS {priceValue.toLocaleString()}
                </span>
              ) : (
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  Free
                </span>
              )}
            </div>
          )}

          {isTeacher && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              👥 {courseData.enrolled_students || 0} students
            </span>
          )}
          
          <div className="flex gap-2 items-center">
            {!isTeacher ? (
              <>
                <Link 
                  to={`/student/course-details/${courseData.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium"
                >
                  {enrolled ? 'Continue →' : 'View Details'}
                </Link>
                {!enrolled && isPaid && (
                  <button
                    onClick={handleAddToCartClick}
                    className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                    title="Add to cart"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                )}
                {!enrolled && !isPaid && onEnroll && (
                  <button
                    onClick={handleEnrollClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors"
                  >
                    Enroll Free
                  </button>
                )}
              </>
            ) : (
              <Link 
                to={`/teacher/courses/${courseData.id}/lessons`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium"
              >
                Manage Lessons →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
