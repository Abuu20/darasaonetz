import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Spinner } from '../../components/ui'
import RatingStars from '../../components/ui/RatingStars'
import WishlistButton from '../../components/ui/WishlistButton'

export default function Wishlist() {
  const { user } = useAuth()
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
            profiles:teacher_id (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWishlist(data || [])
    } catch (error) {
      console.error('Error fetching wishlist:', error)
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

      // Remove from wishlist after enrollment
      await supabase
        .from('wishlists')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId)

      // Refresh both lists
      await fetchWishlist()
      await fetchEnrolledCourses()
      
      alert('Successfully enrolled in course!')
    } catch (error) {
      console.error('Error enrolling:', error)
      alert('Failed to enroll. Please try again.')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-sm md:text-base text-blue-100">
          Courses you've saved for later
        </p>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const course = item.courses
            const isEnrolled = enrolledCourses.includes(course.id)
            
            return (
              <Card key={item.id} hover className="relative">
                {/* Remove button */}
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton courseId={course.id} onToggle={fetchWishlist} />
                </div>

                {/* Course Thumbnail */}
                <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    '📚'
                  )}
                </div>

                {/* Course Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                      {course.level}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{course.title}</h3>
                  
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
                    <span>👤 {course.profiles?.full_name || 'Instructor'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {course.price > 0 ? (
                        <span className="text-2xl font-bold text-gray-800">
                          ${course.price}
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-green-600">
                          Free
                        </span>
                      )}
                    </div>
                    
                    {isEnrolled ? (
                      <Link
                        to={`/student/course/${course.id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Enroll Now
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
            <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
            <p className="text-gray-400 mb-6">Save courses you're interested in for later</p>
            <Link to="/student/browse">
              <Button variant="primary">Browse Courses</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
