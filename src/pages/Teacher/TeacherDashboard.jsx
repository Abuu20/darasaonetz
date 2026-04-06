// src/pages/Teacher/TeacherDashboard.jsx
import { useTheme } from '../../context/ThemeContext'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Button, Card, Spinner, Tabs, Avatar } from '../../components/ui'
import RatingStars from '../../components/ui/RatingStars'
import CreateCourse from './CreateCourse'
import LessonManager from './LessonManager'
import TeacherProfile from './Profile'
import TeacherMyCourses from './MyCourses'
import StudentsList from './StudentsList'
import TeacherAnalytics from './Analytics'
import TeacherCertificates from './Certificates'
import TeacherForum from './TeacherForum'
import TeacherTopicDetail from './TeacherTopicDetail'
import CourseQuizResults from './CourseQuizResults'

export default function TeacherDashboard() {
  const { showSuccess, showError, showWarning, showInfo } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [respondingTo, setRespondingTo] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    publishedCourses: 0,
    draftCourses: 0,
    averageRating: 0,
    totalReviews: 0
  })

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (user && location.pathname === '/teacher') {
      fetchCourses()
    }
  }, [location.pathname, user])

  useEffect(() => {
    if (courses.length > 0) {
      fetchReviews()
    }
  }, [courses])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
    } else {
      setUser(user)
      await fetchCourses()
    }
    setLoading(false)
  }

  async function fetchCourses() {
    if (!user) return

    try {
      // First get courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          categories (
            id,
            name
          ),
          quizzes (id)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (coursesError) throw coursesError

      // Get lesson counts and student counts for each course
      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Get lesson count
          const { count: lessonCount, error: lessonError } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          if (lessonError) console.error('Error counting lessons:', lessonError)

          // Get enrolled students count
          const { count: studentCount, error: studentError } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)

          if (studentError) console.error('Error counting students:', studentError)

          // Get reviews for rating calculation
          const { data: reviews, error: reviewsError } = await supabase
            .from('course_reviews')
            .select('rating')
            .eq('course_id', course.id)

          if (reviewsError) console.error('Error fetching reviews:', reviewsError)

          const avgRating = reviews?.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0

          return {
            ...course,
            lessons_count: lessonCount || 0,
            students_count: studentCount || 0,
            average_rating: avgRating,
            review_count: reviews?.length || 0,
            has_quiz: course.quizzes && course.quizzes.length > 0
          }
        })
      )

      setCourses(coursesWithStats)
      
      // Calculate stats
      const published = coursesWithStats.filter(c => c.status === 'published').length
      const draft = coursesWithStats.filter(c => c.status === 'draft').length
      const totalStudents = coursesWithStats.reduce((acc, course) => acc + (course.students_count || 0), 0)
      const totalRevenue = coursesWithStats.reduce((acc, course) => acc + ((course.students_count || 0) * (course.price || 0)), 0)
      
      let totalRating = 0
      let totalReviews = 0
      coursesWithStats.forEach(course => {
        if (course.review_count > 0) {
          totalRating += course.average_rating
          totalReviews += course.review_count
        }
      })
      
      setStats({
        totalCourses: coursesWithStats.length,
        publishedCourses: published,
        draftCourses: draft,
        totalStudents: totalStudents,
        totalRevenue: totalRevenue,
        averageRating: coursesWithStats.filter(c => c.review_count > 0).length > 0 
          ? totalRating / coursesWithStats.filter(c => c.review_count > 0).length 
          : 0,
        totalReviews: totalReviews
      })
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  async function fetchReviews() {
    if (!user || !courses.length) return

    try {
      const { data, error } = await supabase
        .from('course_reviews')
        .select(`
          *,
          courses!inner (
            id,
            title,
            teacher_id
          ),
          profiles:student_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .in('course_id', courses.map(c => c.id))
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  async function handleRespondToReview(reviewId, courseId, response) {
    if (!response.trim()) {
      showWarning('Please enter a response')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('course_reviews')
        .update({
          teacher_response: response,
          teacher_response_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .eq('course_id', courseId)

      if (error) throw error

      await fetchReviews()
      setRespondingTo(null)
      setResponseText('')
      showSuccess('Response sent successfully!')
      
    } catch (error) {
      console.error('Error responding to review:', error)
      showInfo('Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePublish(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', courseId)

      if (error) throw error
      fetchCourses()
      showSuccess('Course published successfully!')
    } catch (error) {
      console.error('Error publishing course:', error)
      showInfo('Failed to publish course')
    }
  }

  async function handleUnpublish(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'draft' })
        .eq('id', courseId)

      if (error) throw error
      fetchCourses()
      showSuccess('Course unpublished successfully')
    } catch (error) {
      console.error('Error unpublishing course:', error)
      showInfo('Failed to unpublish course')
    }
  }

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('teacher-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `teacher_id=eq.${user.id}`
        },
        () => {
          fetchCourses()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_reviews',
          filter: `course_id=in.(${courses.map(c => c.id).join(',')})`
        },
        () => {
          fetchReviews()
          fetchCourses()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, courses])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'My Courses' },
    { id: 'reviews', label: `Reviews (${stats.totalReviews})` },
    { id: 'students', label: 'Students' },
    { id: 'analytics', label: 'Analytics' }
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
                <p className="text-purple-100">Manage your courses and track your performance</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm mb-1">Total Courses</h3>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalCourses}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm mb-1">Total Students</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm mb-1">Total Revenue</h3>
                    <p className="text-3xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-4">
                    <h3 className="text-gray-500 text-sm mb-1">Average Rating</h3>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'} ⭐
                    </p>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end">
                <Link to="/teacher/courses/new">
                  <Button variant="primary" size="lg">
                    + Create New Course
                  </Button>
                </Link>
              </div>

              <Card>
                <Tabs tabs={tabs} defaultTab="overview" onChange={setActiveTab}>
                  <div id="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">Quick Stats</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Published Courses:</span>
                              <span className="font-medium text-green-600">{stats.publishedCourses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Draft Courses:</span>
                              <span className="font-medium text-orange-600">{stats.draftCourses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Lessons:</span>
                              <span className="font-medium text-blue-600">
                                {courses.reduce((sum, c) => sum + (c.lessons_count || 0), 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                      <Card>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">Recent Activity</h3>
                          {reviews.length > 0 ? (
                            <p className="text-sm text-gray-500">
                              {reviews.length} new review{reviews.length !== 1 ? 's' : ''}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm">No recent activity</p>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  <div id="courses" className="space-y-4">
                    {courses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map(course => (
                          <Card key={course.id} hover>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-1">{course.title}</h3>
                              <div className="space-y-2 text-sm">
                                <p className="text-gray-500">Level: {course.level || 'Not specified'}</p>
                                <p className="text-gray-500">Lessons: {course.lessons_count || 0}</p>
                                <p className="text-gray-500">Students: {course.students_count || 0}</p>
                                {course.review_count > 0 && (
                                  <div className="flex items-center gap-2">
                                    <RatingStars rating={course.average_rating} readonly size="sm" />
                                    <span className="text-xs text-gray-500">
                                      ({course.review_count} reviews)
                                    </span>
                                  </div>
                                )}
                                <p className="text-gray-500">
                                  Status: 
                                  <span className={`ml-1 capitalize ${
                                    course.status === 'published' ? 'text-green-600' : 'text-orange-600'
                                  }`}>
                                    {course.status}
                                  </span>
                                </p>
                              </div>
                              <div className="mt-4 flex gap-2 flex-wrap">
                                <Link to={`/teacher/courses/${course.id}/lessons`} className="flex-1 min-w-[100px]">
                                  <Button variant="primary" size="sm" fullWidth>
                                    Manage Lessons
                                  </Button>
                                </Link>
                                
                                {course.has_quiz && (
                                  <Link to={`/teacher/courses/${course.id}/results`}>
                                    <Button variant="outline" size="sm">
                                      📊 Results
                                    </Button>
                                  </Link>
                                )}
                                
                                <Link to={`/teacher/forum/${course.id}`}>
                                  <Button variant="outline" size="sm">
                                    💬 Forum
                                  </Button>
                                </Link>
                                
                                {course.status === 'draft' ? (
                                  <Button 
                                    variant="success" 
                                    size="sm" 
                                    onClick={() => handlePublish(course.id)}
                                  >
                                    Publish
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="warning" 
                                    size="sm" 
                                    onClick={() => handleUnpublish(course.id)}
                                  >
                                    Unpublish
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
                        <Link to="/teacher/courses/new">
                          <Button variant="primary">Create Your First Course</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div id="reviews" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Student Reviews</h3>
                      <Button size="sm" variant="outline" onClick={() => fetchReviews()}>
                        Refresh
                      </Button>
                    </div>
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <Card key={review.id}>
                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar 
                                  src={review.profiles?.avatar_url} 
                                  alt={review.profiles?.full_name} 
                                  size="md" 
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div>
                                      <p className="font-semibold">
                                        {review.profiles?.full_name || 'Anonymous'}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Course: {review.courses?.title}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <RatingStars rating={review.rating} readonly size="sm" />
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(review.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  {review.comment && (
                                    <p className="mt-3 text-gray-700 dark:text-gray-300">
                                      "{review.comment}"
                                    </p>
                                  )}
                                  
                                  {review.teacher_response ? (
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                                        Your Response:
                                      </p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {review.teacher_response}
                                      </p>
                                      <button
                                        onClick={() => {
                                          setRespondingTo(review.id)
                                          setResponseText(review.teacher_response || '')
                                        }}
                                        className="text-xs text-blue-600 hover:underline mt-2"
                                      >
                                        Edit Response
                                      </button>
                                    </div>
                                  ) : respondingTo === review.id ? (
                                    <div className="mt-3">
                                      <textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        rows="3"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Write your response to this student..."
                                        disabled={submitting}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleRespondToReview(review.id, review.course_id, responseText)}
                                          disabled={submitting}
                                        >
                                          {submitting ? 'Sending...' : 'Send Response'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setRespondingTo(null)
                                            setResponseText('')
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setRespondingTo(review.id)}
                                      className="mt-3 text-sm text-blue-600 hover:underline"
                                    >
                                      Respond to this review
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-4xl mb-4">⭐</p>
                        <p className="text-gray-500">No reviews yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Reviews from students will appear here
                        </p>
                      </div>
                    )}
                  </div>

                  <div id="students"><StudentsList /></div>
                  <div id="analytics"><TeacherAnalytics /></div>
                </Tabs>
              </Card>
            </div>
          } />
          <Route path="/profile" element={<TeacherProfile />} />
          <Route path="/courses/new" element={<CreateCourse />} />
          <Route path="/courses/:courseId/lessons" element={<LessonManager />} />
          <Route path="/courses/:courseId/results" element={<CourseQuizResults />} />
          <Route path="/courses" element={<TeacherMyCourses />} />
          <Route path="/students" element={<StudentsList />} />
          <Route path="/analytics" element={<TeacherAnalytics />} />
          <Route path="/certificates" element={<TeacherCertificates />} />
          <Route path="/forum/:courseId" element={<TeacherForum />} />
          <Route path="/forum/:courseId/topic/:topicId" element={<TeacherTopicDetail />} />
        </Routes>
      </div>
    </div>
  )
}