import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Select } from '../../components/ui'

export default function Reports() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('month')
  const [reports, setReports] = useState({
    userGrowth: [],
    courseGrowth: [],
    revenueData: [],
    topCourses: [],
    topTeachers: []
  })

  useEffect(() => {
    checkAdminAccess()
    fetchReports()
  }, [timeframe])

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      navigate('/')
    }
  }

  async function fetchReports() {
    try {
      // Fetch top courses by enrollment
      const { data: topCourses } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          profiles (full_name),
          enrollments (count),
          price
        `)
        .eq('status', 'published')
        .order('enrollments.count', { ascending: false })
        .limit(5)

      // Fetch top teachers by course count
      const { data: topTeachers } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          courses: courses!teacher_id (count)
        `)
        .eq('role', 'teacher')
        .order('courses.count', { ascending: false })
        .limit(5)

      setReports({
        topCourses: topCourses || [],
        topTeachers: topTeachers || []
      })

    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-red-600">Darasaone Admin</h1>
            <div className="flex gap-4">
              <Link to="/admin" className="text-gray-600 hover:text-red-600">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-red-600">Users</Link>
              <Link to="/admin/courses" className="text-gray-600 hover:text-red-600">Courses</Link>
              <Link to="/admin/reports" className="text-red-600 font-medium">Reports</Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-red-600">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
            <p className="text-red-100">Platform insights and performance metrics</p>
          </div>

          {/* Timeframe Filter */}
          <Card>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Report Period</h2>
              <Select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                options={[
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' },
                  { value: 'quarter', label: 'Last 90 Days' },
                  { value: 'year', label: 'Last 12 Months' }
                ]}
                className="w-48"
              />
            </div>
          </Card>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <h3 className="font-semibold">User Growth</h3>
              </Card.Header>
              <Card.Body>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📈</p>
                    <p>User growth chart coming soon</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="font-semibold">Revenue Overview</h3>
              </Card.Header>
              <Card.Body>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-4xl mb-2">💰</p>
                    <p>Revenue chart coming soon</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <h3 className="font-semibold">Top Performing Courses</h3>
              </Card.Header>
              <Card.Body>
                {reports.topCourses.length > 0 ? (
                  <div className="space-y-3">
                    {reports.topCourses.map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <span className="font-medium">{index + 1}. </span>
                          <span>{course.title}</span>
                          <p className="text-xs text-gray-500">by {course.profiles?.full_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{course.enrollments?.length || 0}</p>
                          <p className="text-xs text-gray-500">enrollments</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No data available</p>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 className="font-semibold">Top Teachers</h3>
              </Card.Header>
              <Card.Body>
                {reports.topTeachers.length > 0 ? (
                  <div className="space-y-3">
                    {reports.topTeachers.map((teacher, index) => (
                      <div key={teacher.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <span className="font-medium">{index + 1}. </span>
                          <span>{teacher.full_name}</span>
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{teacher.courses?.length || 0}</p>
                          <p className="text-xs text-gray-500">courses</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No data available</p>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
