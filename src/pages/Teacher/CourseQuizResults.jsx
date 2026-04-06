// src/pages/Teacher/CourseQuizResults.jsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import QuizResults from '../../components/quiz/QuizResults'
import { Card, Button, Spinner, Select } from '../../components/ui'

export default function CourseQuizResults() {
  const { courseId } = useParams()
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuizId, setSelectedQuizId] = useState(null)
  const [course, setCourse] = useState(null)

  useEffect(() => {
    fetchData()
  }, [courseId])

  async function fetchData() {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })

      if (quizzesError) throw quizzesError

      setQuizzes(quizzesData || [])
      
      if (quizzesData && quizzesData.length > 0) {
        setSelectedQuizId(quizzesData[0].id)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/teacher/courses" className="text-blue-600 hover:underline">
            ← Back to Courses
          </Link>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-gray-500 text-lg">No quizzes created for this course yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Create a quiz in the Lesson Manager to see results
            </p>
            <Link to={`/teacher/courses/${courseId}/lessons`}>
              <Button className="mt-4">Create Quiz</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <Link to="/teacher/courses" className="text-blue-600 hover:underline text-sm">
            ← Back to Courses
          </Link>
          <h1 className="text-2xl font-bold mt-2">{course?.title} - Quiz Results</h1>
        </div>
        <Link to={`/teacher/courses/${courseId}/lessons`}>
          <Button variant="outline">Manage Quizzes</Button>
        </Link>
      </div>

      {quizzes.length > 1 && (
        <Card className="mb-6">
          <div className="p-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Select Quiz
            </label>
            <Select
              value={selectedQuizId || ''}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              options={quizzes.map(quiz => ({
                value: quiz.id,
                label: `${quiz.title}${quiz.time_limit ? ` (${quiz.time_limit} min)` : ''}`
              }))}
            />
          </div>
        </Card>
      )}

      {selectedQuiz && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="p-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">{selectedQuiz.title}</h2>
                {selectedQuiz.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedQuiz.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>⏱️ Time limit: {selectedQuiz.time_limit || 'No limit'} minutes</span>
                  <span>✓ Passing score: {selectedQuiz.passing_score || 70}%</span>
                  <span>📝 Attempts allowed: {selectedQuiz.attempts_allowed || 1}</span>
                </div>
              </div>
              <Link to={`/teacher/courses/${courseId}/lessons`}>
                <Button size="sm" variant="outline">
                  Edit Quiz
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {selectedQuizId && (
        <QuizResults courseId={courseId} quizId={selectedQuizId} />
      )}
    </div>
  )
}