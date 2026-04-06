// src/pages/Teacher/Analytics.jsx
import { useState, useEffect } from 'react'
import { teacherQueries } from '../../supabase/queries/users'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/client'
import { Card, Select, Spinner, Tabs } from '../../components/ui'

export default function TeacherAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [earnings, setEarnings] = useState(null)
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    quizzes: []
  })
  const [period, setPeriod] = useState('month')
  const [activeTab, setActiveTab] = useState('revenue')

  useEffect(() => {
    if (user) {
      fetchEarnings()
      fetchQuizStats()
    }
  }, [user, period])

  async function fetchEarnings() {
    try {
      const data = await teacherQueries.getEarnings(user.id, period)
      setEarnings(data)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    }
  }

  async function fetchQuizStats() {
    try {
      // Get all courses by this teacher
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('teacher_id', user.id)

      if (coursesError) throw coursesError

      const courseIds = courses.map(c => c.id)

      // Get all quizzes for these courses
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*, course_id')
        .in('course_id', courseIds)

      if (quizzesError) throw quizzesError

      // Get all attempts for these quizzes
      const quizIds = quizzes.map(q => q.id)
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*, quiz_id')
        .in('quiz_id', quizIds)
        .not('completed_at', 'is', null)

      if (attemptsError) throw attemptsError

      // Calculate stats per quiz
      const quizStatsList = quizzes.map(quiz => {
        const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id)
        const scores = quizAttempts.map(a => a.score || 0)
        const passed = quizAttempts.filter(a => a.passed === true).length
        const course = courses.find(c => c.id === quiz.course_id)
        
        return {
          id: quiz.id,
          title: quiz.title,
          course_title: course?.title || 'Unknown Course',
          total_attempts: quizAttempts.length,
          average_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          pass_rate: quizAttempts.length > 0 ? (passed / quizAttempts.length) * 100 : 0,
          highest_score: scores.length > 0 ? Math.max(...scores) : 0,
          lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
          time_limit: quiz.time_limit,
          passing_score: quiz.passing_score
        }
      }).filter(q => q.total_attempts > 0) // Only show quizzes with attempts

      const totalAttempts = quizStatsList.reduce((sum, q) => sum + q.total_attempts, 0)
      const avgScore = quizStatsList.length > 0 
        ? quizStatsList.reduce((sum, q) => sum + q.average_score, 0) / quizStatsList.length 
        : 0
      const passRate = quizStatsList.length > 0 
        ? quizStatsList.reduce((sum, q) => sum + q.pass_rate, 0) / quizStatsList.length 
        : 0

      setQuizStats({
        totalQuizzes: quizzes.length,
        totalAttempts: totalAttempts,
        averageScore: avgScore,
        passRate: passRate,
        quizzes: quizStatsList
      })
    } catch (error) {
      console.error('Error fetching quiz stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'revenue', label: '💰 Revenue' },
    { id: 'quizzes', label: '📝 Quiz Analytics' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: 'week', label: 'Last 7 Days' },
            { value: 'month', label: 'Last 30 Days' },
            { value: 'year', label: 'Last 12 Months' }
          ]}
        />
      </div>

      <Card>
        <Tabs tabs={tabs} defaultTab="revenue" onChange={setActiveTab}>
          {/* Revenue Tab */}
          <div id="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <div className="p-4">
                  <h3 className="text-gray-500 mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-blue-600">${earnings?.total || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">{earnings?.count} enrollments</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <h3 className="text-gray-500 mb-2">Average per Course</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ${earnings?.byCourse?.length ? (earnings.total / earnings.byCourse.length).toFixed(2) : 0}
                  </p>
                </div>
              </Card>
            </div>

            <Card>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Revenue by Course</h2>
                {earnings?.byCourse?.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.byCourse.map(course => (
                      <div key={course.title} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-gray-500">{course.count} enrollments</p>
                        </div>
                        <p className="font-semibold text-blue-600">${course.revenue}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">No revenue data available</p>
                )}
              </div>
            </Card>
          </div>

          {/* Quiz Analytics Tab */}
          <div id="quizzes" className="space-y-6">
            {/* Quiz Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <p className="text-gray-500 text-sm mb-1">Total Quizzes</p>
                  <p className="text-2xl font-bold text-purple-600">{quizStats.totalQuizzes}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-gray-500 text-sm mb-1">Total Attempts</p>
                  <p className="text-2xl font-bold text-blue-600">{quizStats.totalAttempts}</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-gray-500 text-sm mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-green-600">{quizStats.averageScore.toFixed(1)}%</p>
                </div>
              </Card>
              <Card>
                <div className="p-4">
                  <p className="text-gray-500 text-sm mb-1">Overall Pass Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{quizStats.passRate.toFixed(1)}%</p>
                </div>
              </Card>
            </div>

            {/* Quiz Performance Table */}
            <Card>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Quiz Performance</h2>
                {quizStats.quizzes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4">Quiz</th>
                          <th className="text-left py-3 px-4">Course</th>
                          <th className="text-left py-3 px-4">Attempts</th>
                          <th className="text-left py-3 px-4">Avg Score</th>
                          <th className="text-left py-3 px-4">Pass Rate</th>
                          <th className="text-left py-3 px-4">Highest</th>
                          <th className="text-left py-3 px-4">Lowest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizStats.quizzes.map(quiz => (
                          <tr key={quiz.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{quiz.title}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{quiz.course_title}</td>
                            <td className="py-3 px-4">{quiz.total_attempts}</td>
                            <td className="py-3 px-4">
                              <span className={quiz.average_score >= (quiz.passing_score || 70) ? 'text-green-600' : 'text-orange-600'}>
                                {quiz.average_score.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full" 
                                    style={{ width: `${quiz.pass_rate}%` }}
                                  />
                                </div>
                                <span className="text-sm">{quiz.pass_rate.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-green-600">{quiz.highest_score}%</td>
                            <td className="py-3 px-4 text-red-600">{quiz.lowest_score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">No quiz data available yet. Students haven't taken any quizzes.</p>
                )}
              </div>
            </Card>

            {/* Quiz Performance Chart Placeholder */}
            <Card>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Quiz Score Distribution</h2>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📊</p>
                    <p>Score distribution chart coming soon</p>
                    <p className="text-xs mt-2">Shows how students perform across score ranges</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Low Performing Quizzes Alert */}
            {quizStats.quizzes.filter(q => q.pass_rate < 50).length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <div className="p-4">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2">
                    <span>⚠️</span> Low Performing Quizzes
                  </h3>
                  <p className="text-sm text-red-600 mt-1">
                    The following quizzes have a pass rate below 50%. Consider reviewing the material:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {quizStats.quizzes.filter(q => q.pass_rate < 50).map(quiz => (
                      <li key={quiz.id} className="text-sm text-red-600">
                        • {quiz.title} - {quiz.pass_rate.toFixed(0)}% pass rate ({quiz.total_attempts} attempts)
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </div>
        </Tabs>
      </Card>
    </div>
  )
}