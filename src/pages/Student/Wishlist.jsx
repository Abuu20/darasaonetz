import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Card, Button, Spinner } from '../../components/ui'
import RatingStars from '../../components/ui/RatingStars'
import { useCart } from '../../context/CartContext'

export default function Wishlist() {
  const { user } = useAuth()
  const { showSuccess, showError } = useTheme()
  const { addToCart } = useCart()
  const { t } = useTranslation()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState([])

  useEffect(() => {
    if (user) {
      fetchWishlist()
      fetchEnrolledCourses()
    }
  }, [user])

  async function fetchWishlist() {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            level,
            price,
            average_rating,
            review_count,
            status,
            profiles:teacher_id (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const validWishlist = data?.filter(item => item.courses !== null && item.courses.status === 'published') || []
      setWishlist(validWishlist)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      showError(t('common.loadingError'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchEnrolledCourses() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)

      if (error) throw error
      setEnrolledCourses(data?.map(e => e.course_id) || [])
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
    }
  }

  async function handleEnroll(courseId) {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0,
          completed_lessons: []
        })

      if (error) throw error

      await supabase
        .from('wishlists')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId)

      await fetchWishlist()
      await fetchEnrolledCourses()
      showSuccess(t('auth.enrollSuccess'))
    } catch (error) {
      console.error('Error enrolling:', error)
      showError(t('auth.enrollFailed'))
    }
  }

  async function handleRemoveFromWishlist(courseId) {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId)

      if (error) throw error
      await fetchWishlist()
      showSuccess(t('student.wishlist.removed'))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      showError(t('common.errorOccurred'))
    }
  }

  async function handleAddToCart(course) {
    addToCart(course)
    showSuccess(`${course.title} ${t('student.wishlist.addedToCart')}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('student.wishlist.title')}</h1>
        <p className="text-sm md:text-base text-blue-100">
          {t('student.wishlist.subtitle')}
        </p>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const course = item.courses
            if (!course) return null
            
            const isEnrolled = enrolledCourses.includes(course.id)
            
            return (
              <Card key={item.id} hover className="relative">
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveFromWishlist(course.id)}
                  className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-red-50"
                  aria-label={t('common.remove')}
                >
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Course Thumbnail */}
                <Link to={`/student/course-details/${course.id}`}>
                  <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      '📚'
                    )}
                    {course.average_rating > 0 && (
                      <div className="absolute top-2 left-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                        <RatingStars rating={course.average_rating} readonly size="sm" />
                        <span className="text-xs text-white ml-1">
                          ({course.review_count})
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Course Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                      {t(`courses.${course.level}`) || course.level}
                    </span>
                  </div>

                  <Link to={`/student/course-details/${course.id}`}>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1 hover:text-blue-600 transition">
                      {course.title}
                    </h3>
                  </Link>
                  
                  {/* Rating */}
                  {course.average_rating > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <RatingStars rating={course.average_rating} readonly size="sm" />
                      <span className="text-xs text-gray-500">
                        ({course.review_count})
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>👤 {course.profiles?.full_name?.split(' ')[0] || t('student.browseCourses.instructor')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {course.price > 0 ? (
                        <span className="text-2xl font-bold text-gray-800">
                          TZS {course.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-green-600">
                          {t('student.courseDetails.free')}
                        </span>
                      )}
                    </div>
                    
                    {isEnrolled ? (
                      <Link
                        to={`/student/course/${course.id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        {t('student.wishlist.continueLearning')}
                      </Link>
                    ) : course.price > 0 ? (
                      <button
                        onClick={() => handleAddToCart(course)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                      >
                        {t('student.wishlist.addToCart')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        {t('student.wishlist.enrollFree')}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">❤️</p>
            <p className="text-gray-500 text-lg mb-4">{t('student.wishlist.empty')}</p>
            <p className="text-gray-400 mb-6">{t('student.wishlist.emptyHint')}</p>
            <Link to="/student/browse">
              <Button variant="primary">{t('student.wishlist.browseCourses')}</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}