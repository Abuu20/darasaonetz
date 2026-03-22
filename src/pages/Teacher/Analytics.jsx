import { useState, useEffect } from 'react'
import { teacherQueries } from '../../supabase/queries/users'
import { useAuth } from '../../context/AuthContext'
import { Card, Select, Spinner } from '../../components/ui'

export default function TeacherAnalytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [earnings, setEarnings] = useState(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    if (user) {
      fetchEarnings()
    }
  }, [user, period])

  async function fetchEarnings() {
    try {
      const data = await teacherQueries.getEarnings(user.id, period)
      setEarnings(data)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-600">${earnings?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{earnings?.count} enrollments</p>
        </Card>
        <Card>
          <h3 className="text-gray-500 mb-2">Average per Course</h3>
          <p className="text-3xl font-bold text-green-600">
            ${earnings?.byCourse?.length ? (earnings.total / earnings.byCourse.length).toFixed(2) : 0}
          </p>
        </Card>
      </div>

      {/* Course Breakdown */}
      <Card>
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
      </Card>

      {/* Chart Placeholder */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-4xl mb-2">📊</p>
            <p>Analytics chart coming soon</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
