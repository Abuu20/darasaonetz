import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import LessonList from '../../components/courses/LessonList'
import VideoPlayer from '../../components/courses/VideoPlayer'
import CourseProgress from '../../components/courses/CourseProgress'
import ReviewForm from '../../components/courses/ReviewForm'
import ReviewsList from '../../components/courses/ReviewsList'
import QuizTaker from '../../components/quiz/QuizTaker'
import CertificateGenerator from '../../components/certificates/CertificateGenerator'
import { Tabs, Card, Button, Spinner } from '../../components/ui'

export default function CourseView() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showSuccess, showError } = useTheme()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [completedLessons, setCompletedLessons] = useState([])
  const [hasReviewed, setHasReviewed] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [activeTab, setActiveTab] = useState('content')
  const [certificateIssued, setCertificateIssued] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  async function fetchCourseData() {
    try {
      if (!user) {
        navigate('/login')
        return
      }

      // Check if user is enrolled
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (enrollmentError || !enrollmentData) {
        navigate('/student/browse')
        return
      }

      setEnrollment(enrollmentData)

      // Fetch course details with lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles (
            full_name
          ),
          lessons (
            id,
            title,
            description,
            video_url,
            content,
            duration,
            order_index,
            is_free
          )
        `)
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)
      
      // Sort lessons
      const sortedLessons = courseData.lessons.sort((a, b) => a.order_index - b.order_index)
      setLessons(sortedLessons)
      
      if (sortedLessons.length > 0) {
        setCurrentLesson(sortedLessons[0])
      }

      // Get completed lessons
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)

      setCompletedLessons(completions?.map(c => c.lesson_id) || [])

      // Check if user has reviewed
      const { data: review } = await supabase
        .from('course_reviews')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single()

      setHasReviewed(!!review)

      // Fetch quiz for this course
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle()

      setQuiz(quizData)

      // Check if user has taken the quiz
      if (quizData) {
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .select('score, passed')
          .eq('quiz_id', quizData.id)
          .eq('student_id', user.id)
          .maybeSingle()

        if (attempt) {
          setHasTakenQuiz(true)
          setQuizScore(attempt.score)
        }
      }

      // Check if certificate already issued
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()
      
      setCertificateIssued(!!existingCert)

    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markLessonComplete(lessonId) {
    try {
      // Mark lesson as completed
      await supabase
        .from('lesson_completions')
        .insert({
          student_id: user.id,
          lesson_id: lessonId,
          course_id: courseId
        })

      const newCompleted = [...completedLessons, lessonId]
      setCompletedLessons(newCompleted)

      const progress = (newCompleted.length / lessons.length) * 100

      await supabase
        .from('enrollments')
        .update({
          progress: progress,
          completed_lessons: newCompleted,
          last_accessed: new Date().toISOString()
        })
        .eq('id', enrollment.id)

      setEnrollment({
        ...enrollment,
        progress: progress,
        completed_lessons: newCompleted
      })

      showSuccess('Lesson completed!')

      // Check if course is now 100% complete and certificate not issued yet
      if (progress === 100 && !certificateIssued) {
        // Refresh course data to show certificate button
        await fetchCourseData()
      }

    } catch (error) {
      console.error('Error marking lesson complete:', error)
      showError('Failed to mark lesson complete')
    }
  }

  async function handleQuizComplete(passed) {
    if (passed) {
      showSuccess('Congratulations! You passed the quiz!')
      // Update course progress if quiz is required
      const newProgress = Math.min(100, enrollment.progress + 20)
      await supabase
        .from('enrollments')
        .update({ progress: newProgress })
        .eq('id', enrollment.id)
      
      setEnrollment({ ...enrollment, progress: newProgress })
      
      // Check if course is now 100% complete and certificate not issued yet
      if (newProgress === 100 && !certificateIssued) {
        await fetchCourseData()
      }
    } else {
      showError('Quiz not passed. You can try again.')
    }
    await fetchCourseData()
  }

  const tabs = [
    { id: 'content', label: 'Course Content' },
    { id: 'reviews', label: `Reviews (${course?.review_count || 0})` },
    ...(quiz ? [{ id: 'quiz', label: hasTakenQuiz ? `Quiz (${quizScore}%)` : 'Quiz' }] : [])
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  const isComplete = enrollment?.progress === 100

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar with lessons */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">{course?.title}</h2>
          <p className="text-sm text-gray-500">{course?.profiles?.full_name}</p>
          <CourseProgress progress={enrollment?.progress || 0} />
        </div>
        
        <LessonList 
          lessons={lessons}
          currentLesson={currentLesson}
          completedLessons={completedLessons}
          onSelectLesson={setCurrentLesson}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <Tabs tabs={tabs} defaultTab="content" onChange={setActiveTab}>
          {/* Content Tab */}
          <div id="content">
            {currentLesson ? (
              <div className="p-4 md:p-6">
                {/* Video Player */}
                {currentLesson.video_url && (
                  <div className="mb-6">
                    <VideoPlayer 
                      videoUrl={currentLesson.video_url}
                      title={currentLesson.title}
                    />
                  </div>
                )}
                
                {/* Lesson Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
                  <h1 className="text-xl md:text-2xl font-bold mb-4">{currentLesson.title}</h1>
                  
                  {currentLesson.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{currentLesson.description}</p>
                  )}
                  
                  {currentLesson.content && (
                    <div className="prose dark:prose-invert max-w-none mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="whitespace-pre-wrap">
                          {currentLesson.content}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {!completedLessons.includes(currentLesson.id) ? (
                      <button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      >
                        Mark as Complete
                      </button>
                    ) : (
                      <div className="inline-flex items-center bg-green-100 text-green-700 px-6 py-2 rounded-lg">
                        ✓ Lesson Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-500">
                  <p className="text-4xl mb-4">📚</p>
                  <p>Select a lesson to start learning</p>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Tab */}
          <div id="reviews" className="p-4 md:p-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Course Reviews</h2>
              </Card.Header>
              <Card.Body>
                {!hasReviewed && enrollment?.progress > 50 && (
                  <div className="mb-6">
                    <ReviewForm 
                      courseId={courseId} 
                      onReviewSubmitted={() => {
                        setHasReviewed(true)
                        fetchCourseData()
                      }}
                    />
                  </div>
                )}
                
                <ReviewsList courseId={courseId} />
              </Card.Body>
            </Card>
          </div>

          {/* Quiz Tab */}
          {quiz && (
            <div id="quiz" className="p-4 md:p-6">
              {hasTakenQuiz ? (
                <Card>
                  <Card.Body className="text-center py-8">
                    <div className={`text-6xl mb-4 ${quizScore >= quiz.passing_score ? 'text-green-500' : 'text-orange-500'}`}>
                      {quizScore >= quiz.passing_score ? '🎉' : '📝'}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {quizScore >= quiz.passing_score ? 'Quiz Passed!' : 'Quiz Attempted'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your score: {quizScore}% (Required: {quiz.passing_score}%)
                    </p>
                    {quiz.attempts_allowed > 1 && quizScore < quiz.passing_score && (
                      <Button onClick={() => {
                        setHasTakenQuiz(false)
                        setQuizScore(null)
                      }}>
                        Retake Quiz
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                <QuizTaker quizId={quiz.id} onComplete={handleQuizComplete} />
              )}
            </div>
          )}
        </Tabs>

        {/* Certificate Section - Show when course is 100% complete */}
        {isComplete && (
          <div className="p-4 md:p-6 border-t mt-4">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">🎓 Course Completion Certificate</h2>
              </Card.Header>
              <Card.Body>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 text-center">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">
                    Congratulations!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You've successfully completed this course. Claim your certificate of achievement!
                  </p>
                  <CertificateGenerator 
                    studentId={user.id}
                    courseId={courseId}
                    studentName={user.user_metadata?.full_name}
                    courseTitle={course?.title}
                    teacherName={course?.profiles?.full_name}
                  />
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
