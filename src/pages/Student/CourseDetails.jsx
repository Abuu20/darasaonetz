import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useTheme } from '../../context/ThemeContext'
import { Card, Button, Spinner, Avatar } from '../../components/ui'
import RatingStars from '../../components/ui/RatingStars'

export default function CourseDetails() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { showSuccess, showError } = useTheme()
  const { t } = useTranslation()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [whatYoullLearn, setWhatYoullLearn] = useState([])
  const [instructor, setInstructor] = useState(null)

  useEffect(() => {
    fetchCourseDetails()
    if (user) {
      checkEnrollment()
      checkWishlist()
    }
  }, [courseId, user])

  async function fetchCourseDetails() {
    try {
      // Fetch course with lessons and reviews
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (
            id,
            title,
            description,
            duration,
            is_free,
            order_index,
            video_url
          ),
          course_reviews (
            rating,
            comment,
            created_at,
            student_id,
            profiles:student_id (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // Fetch instructor profile separately
      if (courseData.teacher_id) {
        const { data: teacherData, error: teacherError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, bio, expertise, qualifications, role')
          .eq('id', courseData.teacher_id)
          .single()

        if (!teacherError && teacherData) {
          setInstructor(teacherData)
        }
      }

      setCourse(courseData)
      
      // Generate "What You'll Learn" from lessons
      const learningPoints = []
      courseData.lessons?.forEach(lesson => {
        if (lesson.title && !learningPoints.includes(lesson.title)) {
          learningPoints.push(lesson.title)
        }
      })
      
      if (courseData.type === 'islamic') {
        learningPoints.unshift(t('courseDetails.islamicLearn1') || 'Understand the fundamentals of Islamic teachings')
        learningPoints.push(t('courseDetails.islamicLearn2') || 'Learn proper Quran recitation with Tajweed')
        learningPoints.push(t('courseDetails.islamicLearn3') || 'Study authentic Hadith and Islamic jurisprudence')
      } else {
        learningPoints.unshift(t('courseDetails.academicLearn1') || 'Master core concepts and principles')
        learningPoints.push(t('courseDetails.academicLearn2') || 'Apply knowledge through practical exercises')
        learningPoints.push(t('courseDetails.academicLearn3') || 'Develop critical thinking skills')
      }
      
      setWhatYoullLearn(learningPoints.slice(0, 6))
      
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  async function checkEnrollment() {
    if (!user) return
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()
    setIsEnrolled(!!data)
  }

  async function checkWishlist() {
    if (!user) return
    const { data } = await supabase
      .from('wishlists')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()
    setIsInWishlist(!!data)
  }

  async function handleEnroll() {
    if (!user) {
      navigate('/login')
      return
    }

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
      setIsEnrolled(true)
      showSuccess(t('auth.enrollSuccess') || 'Successfully enrolled!')
      navigate(`/student/course/${courseId}`)
    } catch (error) {
      console.error('Error enrolling:', error)
      showError(t('auth.enrollFailed') || 'Failed to enroll')
    }
  }

  async function handleAddToCart() {
    if (!user) {
      navigate('/login')
      return
    }
    addToCart(course)
    showSuccess(`${course.title} ${t('cart.addedToCart') || 'added to cart'}`)
  }

  async function toggleWishlist() {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      if (isInWishlist) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseId)
        setIsInWishlist(false)
        showSuccess(t('student.wishlist.removed') || 'Removed from wishlist')
      } else {
        await supabase
          .from('wishlists')
          .insert({
            student_id: user.id,
            course_id: courseId
          })
        setIsInWishlist(true)
        showSuccess(t('student.wishlist.added') || 'Added to wishlist')
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      showError(t('common.errorOccurred') || 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">{t('student.courseDetails.courseNotFound') || 'Course not found'}</p>
          <Link to="/student/browse" className="text-blue-600 hover:underline">
            {t('student.courseDetails.browseCourses') || 'Browse Courses'}
          </Link>
        </div>
      </div>
    )
  }

  // Calculate average rating from reviews
  const averageRating = course.course_reviews?.length 
    ? course.course_reviews.reduce((sum, r) => sum + r.rating, 0) / course.course_reviews.length 
    : 0

  const freeLessons = course.lessons?.filter(l => l.is_free).length || 0
  const totalDuration = course.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0
  const videoLessons = course.lessons?.filter(l => l.video_url).length || 0

  // Get instructor display name with fallback
  const instructorName = instructor?.full_name || course.teacher_name || 'Instructor'
  const instructorInitial = instructorName.charAt(0).toUpperCase()

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
            <p className="text-blue-100 mb-4">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span>{averageRating.toFixed(1)}</span>
                <span className="text-blue-200">({course.course_reviews?.length || 0} {t('student.courseDetails.reviews') || 'reviews'})</span>
              </div>
              <div>📚 {course.lessons?.length || 0} {t('student.courseDetails.lessons') || 'lessons'}</div>
              <div>⏱️ {Math.floor(totalDuration / 60)}h {totalDuration % 60}m {t('student.courseDetails.totalHours') || 'total'}</div>
              <div>🎥 {videoLessons} {t('student.courseDetails.videos') || 'videos'}</div>
              <div className="capitalize">📊 {t(`courses.${course.level}`) || course.level}</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center min-w-[200px]">
            {course.price > 0 ? (
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                TZS {course.price.toLocaleString()}
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{t('student.courseDetails.free') || 'Free'}</div>
            )}
            
            {!isEnrolled ? (
              <div className="space-y-2 mt-4">
                {course.price > 0 ? (
                  <Button onClick={handleAddToCart} variant="primary" fullWidth>
                    {t('student.courseDetails.addToCart') || 'Add to Cart'}
                  </Button>
                ) : (
                  <Button onClick={handleEnroll} variant="primary" fullWidth>
                    {t('student.courseDetails.enrollNow') || 'Enroll Now'}
                  </Button>
                )}
                <Button onClick={toggleWishlist} variant="outline" fullWidth>
                  {isInWishlist ? `❤️ ${t('student.courseDetails.saved') || 'Saved'}` : `🤍 ${t('student.courseDetails.saveToWishlist') || 'Save to Wishlist'}`}
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate(`/student/course/${courseId}`)} variant="success" fullWidth>
                {t('student.courseDetails.continueLearning') || 'Continue Learning'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* What You'll Learn */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">{t('student.courseDetails.whatYoullLearn') || 'What You\'ll Learn'}</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {whatYoullLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Course Content */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">{t('student.courseDetails.courseContent') || 'Course Content'}</h2>
              <p className="text-sm text-gray-500">
                {course.lessons?.length} {t('student.courseDetails.lessons') || 'lessons'} • {freeLessons} {t('student.courseDetails.freePreview') || 'free preview'}
              </p>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {course.lessons?.sort((a,b) => a.order_index - b.order_index).map((lesson, idx) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-gray-400 w-8 text-sm">{idx + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium">{lesson.title}</p>
                        {lesson.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{lesson.description}</p>
                        )}
                      </div>
                      {lesson.duration && (
                        <span className="text-xs text-gray-400">{lesson.duration} min</span>
                      )}
                    </div>
                    {lesson.is_free && !isEnrolled && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full ml-2">
                        {t('student.courseDetails.preview') || 'Preview'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Reviews */}
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{t('student.courseDetails.studentReviews') || 'Student Reviews'}</h2>
                <div className="flex items-center gap-2">
                  <RatingStars rating={averageRating} readonly />
                  <span className="text-gray-600">({course.course_reviews?.length || 0})</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {course.course_reviews?.length > 0 ? (
                <div className="space-y-4">
                  {course.course_reviews.map((review, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        {review.profiles?.avatar_url ? (
                          <img src={review.profiles.avatar_url} alt={review.profiles.full_name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">
                            {review.profiles?.full_name?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{review.profiles?.full_name || 'Anonymous'}</p>
                          <RatingStars rating={review.rating} readonly size="sm" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet</p>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Right Column - Instructor Info */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">About the Instructor</h2>
            </Card.Header>
            <Card.Body className="text-center">
              {/* Instructor Avatar */}
              {instructor?.avatar_url ? (
                <img 
                  src={instructor.avatar_url} 
                  alt={instructor.full_name || 'Instructor'}
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
                  {instructorInitial}
                </div>
              )}
              
              {/* Instructor Name */}
              <h3 className="font-semibold text-lg">
                {instructorName}
              </h3>
              
              {/* Instructor Email */}
              {instructor?.email && (
                <p className="text-sm text-gray-500 mt-1">{instructor.email}</p>
              )}
              
              {/* Instructor Role Badge */}
              {instructor?.role && instructor.role === 'teacher' && (
                <p className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-block px-3 py-1 rounded-full mt-2">
                  👨‍🏫 Teacher
                </p>
              )}
              
              {/* Instructor Expertise */}
              {instructor?.expertise && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Expertise</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{instructor.expertise}</p>
                </div>
              )}
              
              {/* Instructor Bio */}
              {instructor?.bio ? (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">About</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left">{instructor.bio}</p>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 italic">No bio available</p>
                </div>
              )}
              
              {/* Instructor Qualifications */}
              {instructor?.qualifications && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Qualifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{instructor.qualifications}</p>
                </div>
              )}
              
              {/* Contact Button */}
              <div className="mt-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  fullWidth
                  onClick={() => window.location.href = `mailto:${instructor?.email || course.teacher_email}`}
                >
                  📧 Contact Teacher
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Course Features */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Course Features</h2>
            </Card.Header>
            <Card.Body className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">🎓 Certificate</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📹 Video Lessons</span>
                <span>{videoLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📝 Quizzes</span>
                <span>1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">💬 Discussion Forum</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📱 Mobile Access</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🔄 Lifetime Access</span>
                <span className="text-green-600">Yes</span>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}