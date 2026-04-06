// src/components/quiz/QuizResults.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Avatar } from '../ui'

export default function QuizResults({ courseId, quizId }) {
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState([])
  const [quiz, setQuiz] = useState(null)
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    highestScore: 0,
    lowestScore: 0
  })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentAnswers, setStudentAnswers] = useState([])
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (quizId) {
      fetchQuizAndAttempts()
    }
  }, [quizId])

  async function fetchQuizAndAttempts() {
    try {
      setLoading(true)
      setError(null)
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle()

      if (quizError) throw quizError
      if (!quizData) {
        setError('Quiz not found')
        setLoading(false)
        return
      }
      
      setQuiz(quizData)

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_options (*)
        `)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])

      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })

      if (attemptsError) throw attemptsError

      let attemptsWithProfiles = attemptsData || []
      
      if (attemptsWithProfiles.length > 0) {
        const studentIds = [...new Set(attemptsWithProfiles.map(a => a.student_id))]
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', studentIds)
        
        if (!profilesError && profilesData) {
          attemptsWithProfiles = attemptsWithProfiles.map(attempt => ({
            ...attempt,
            profiles: profilesData.find(p => p.id === attempt.student_id)
          }))
        }
      }
      
      setAttempts(attemptsWithProfiles)
      
      if (attemptsWithProfiles.length > 0) {
        const scores = attemptsWithProfiles.map(a => a.score || 0)
        const passed = attemptsWithProfiles.filter(a => a.passed === true).length
        
        setStats({
          totalAttempts: attemptsWithProfiles.length,
          averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
          passRate: (passed / attemptsWithProfiles.length) * 100,
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores)
        })
      }
      
    } catch (error) {
      console.error('Error fetching quiz data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStudentAnswers(studentId, attemptId) {
    try {
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select(`
          *,
          quiz_options!option_id (
            id,
            option_text,
            is_correct
          )
        `)
        .eq('attempt_id', attemptId)

      if (answersError) throw answersError

      const enhancedAnswers = (answersData || []).map(answer => {
        const question = questions.find(q => q.id === answer.question_id)
        const selectedOption = answer.quiz_options
        const correctOption = question?.quiz_options?.find(opt => opt.is_correct === true)
        const totalPoints = question?.points || 1
        
        return {
          ...answer,
          question: question,
          selected_option_text: selectedOption?.option_text || 'No answer',
          correct_option_text: correctOption?.option_text || 'Not available',
          is_correct: answer.is_correct || false,
          points_earned: answer.is_correct ? totalPoints : 0,
          total_points: totalPoints
        }
      })

      setStudentAnswers(enhancedAnswers)
    } catch (error) {
      console.error('Error fetching student answers:', error)
      setStudentAnswers([])
    }
  }

  const viewStudentDetails = async (attempt) => {
    setSelectedStudent(attempt)
    await fetchStudentAnswers(attempt.student_id, attempt.id)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-red-500 text-lg">Error loading quiz results</p>
        <p className="text-sm text-gray-400 mt-2">{error}</p>
        <Button className="mt-4" onClick={() => fetchQuizAndAttempts()}>Try Again</Button>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-gray-500 text-lg">Quiz not found</p>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-gray-500 text-lg">No completed quiz attempts yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Students haven't taken this quiz yet
        </p>
      </div>
    )
  }

  const passingScore = quiz?.passing_score || 70

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-gray-500 text-sm mb-1">Total Attempts</p>
            <p className="text-2xl font-bold text-blue-600">{attempts.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-gray-500 text-sm mb-1">Average Score</p>
            <p className="text-2xl font-bold text-purple-600">
              {(attempts.reduce((a, b) => a + (b.score || 0), 0) / attempts.length).toFixed(1)}%
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-gray-500 text-sm mb-1">Pass Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {((attempts.filter(a => a.passed === true).length / attempts.length) * 100).toFixed(1)}%
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-gray-500 text-sm mb-1">Highest Score</p>
            <p className="text-2xl font-bold text-orange-600">
              {Math.max(...attempts.map(a => a.score || 0))}%
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-gray-500 text-sm mb-1">Lowest Score</p>
            <p className="text-2xl font-bold text-red-600">
              {Math.min(...attempts.map(a => a.score || 0))}%
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Student Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time Spent</th>
                  <th className="text-left py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={attempt.profiles?.avatar_url} size="sm" />
                        <span className="font-medium">
                          {attempt.profiles?.full_name || attempt.profiles?.email || 'Student'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        (attempt.score || 0) >= passingScore 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {attempt.score || 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {attempt.passed ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✅ Passed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          ❌ Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatDate(attempt.completed_at)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {formatTime(attempt.time_spent)}
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => viewStudentDetails(attempt)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {selectedStudent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                Quiz Results: {selectedStudent.profiles?.full_name || 'Student'}
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedStudent.score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`text-xl font-semibold ${selectedStudent.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedStudent.passed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Spent</p>
                    <p className="font-medium">{formatTime(selectedStudent.time_spent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-sm">{formatDate(selectedStudent.completed_at)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Question-by-Question Breakdown</h3>
                  <div className="text-sm text-gray-500">
                    Total Points: {studentAnswers.reduce((sum, a) => sum + a.total_points, 0)} | 
                    Earned: {studentAnswers.reduce((sum, a) => sum + a.points_earned, 0)}
                  </div>
                </div>
                
                {studentAnswers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No answer data available</p>
                ) : (
                  studentAnswers.map((answer, idx) => {
                    const isCorrect = answer.is_correct
                    const earnedPoints = answer.points_earned
                    const totalPoints = answer.total_points
                    
                    return (
                      <div key={answer.id} className={`border rounded-lg p-4 ${
                        isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                              isCorrect 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {idx + 1}
                            </span>
                            <p className="font-medium">{answer.question?.question_text || 'Question'}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-semibold px-2 py-1 rounded ${
                              isCorrect 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {earnedPoints}/{totalPoints} pts
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-8 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Student's Answer:</p>
                            <p className={`text-sm font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {answer.selected_option_text || 'No answer provided'}
                              {isCorrect ? ' ✓' : ' ✗'}
                            </p>
                          </div>
                          
                          {!isCorrect && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Correct Answer:</p>
                              <p className="text-sm text-green-700">
                                {answer.correct_option_text}
                              </p>
                            </div>
                          )}
                          
                          {answer.question?.question_type === 'multiple_choice' && answer.question?.quiz_options && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">All Options:</p>
                              <div className="space-y-1">
                                {answer.question.quiz_options.map((opt, optIdx) => (
                                  <div key={opt.id} className={`text-xs ${
                                    opt.is_correct 
                                      ? 'text-green-600 font-medium' 
                                      : opt.id === answer.option_id && !opt.is_correct
                                        ? 'text-red-600 line-through'
                                        : 'text-gray-500'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}. {opt.option_text}
                                    {opt.is_correct && ' ✓ (Correct)'}
                                    {opt.id === answer.option_id && !opt.is_correct && ' (Your answer)'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
            <div className="flex justify-end p-4 border-t dark:border-gray-700">
              <Button onClick={() => setSelectedStudent(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}