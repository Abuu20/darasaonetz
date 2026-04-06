import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner } from '../../components/ui'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    totalCertificates: 0
  })
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    checkAdminAccess()
    fetchDashboardData()
  }, [])

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
      return
    }

    setUser(user)
  }

  async function fetchDashboardData() {
    try {
      const [profiles, courses, enrollments, certificates] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('courses').select('status, price, enrollments(count)'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true })
      ])

      const teachers = profiles.data?.filter(p => p.role === 'teacher').length || 0
      const students = profiles.data?.filter(p => p.role === 'student').length || 0
      const published = courses.data?.filter(c => c.status === 'published').length || 0
      const pending = courses.data?.filter(c => c.status === 'pending').length || 0
      
      const revenue = courses.data?.reduce((acc, course) => {
        if (course.status === 'published') {
          return acc + ((course.enrollments?.[0]?.count || 0) * (course.price || 0))
        }
        return acc
      }, 0) || 0

      setStats({
        totalUsers: profiles.data?.length || 0,
        totalTeachers: teachers,
        totalStudents: students,
        totalCourses: courses.data?.length || 0,
        publishedCourses: published,
        pendingCourses: pending,
        totalEnrollments: enrollments.count || 0,
        totalRevenue: revenue,
        totalCertificates: certificates.count || 0
      })

      const { data: recentCourses } = await supabase
        .from('courses')
        .select(`id, title, status, created_at, profiles (full_name)`)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentActivities(recentCourses?.map(course => ({
        id: course.id,
        type: 'course_created',
        description: `${course.title} was created by ${course.profiles?.full_name || 'Unknown'}`,
        status: course.status,
        time: new Date(course.created_at).toLocaleDateString()
      })) || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
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
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-red-600">Darasaone Admin</h1>
            <div className="flex gap-4">
              <Link to="/admin" className="text-red-600 font-medium">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-red-600">Users</Link>
              <Link to="/admin/courses" className="text-gray-600 hover:text-red-600">Courses</Link>
              <Link to="/admin/certificates" className="text-gray-600 hover:text-red-600">Certificates</Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-red-600">Reports</Link>
              <Link to="/admin/forum" className="text-gray-600 hover:text-red-600">Forum</Link>
              <Link to="/admin/team" className="text-gray-600 hover:text-red-600">Team</Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-red-600">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Admin: {user?.email}</span>
            <Button variant="danger" onClick={handleLogout} size="sm">Logout</Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-red-100">Manage your platform, users, and content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <h3 className="text-gray-500 text-sm mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-red-600">{stats.totalUsers}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-purple-600">👥 {stats.totalTeachers} Teachers</span>
                <span className="text-blue-600">🎓 {stats.totalStudents} Students</span>
              </div>
            </Card>
            <Card>
              <h3 className="text-gray-500 text-sm mb-1">Total Courses</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalCourses}</p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-green-600">✅ {stats.publishedCourses} Published</span>
                <span className="text-orange-600">⏳ {stats.pendingCourses} Pending</span>
              </div>
            </Card>
            <Card>
              <h3 className="text-gray-500 text-sm mb-1">Certificates Issued</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalCertificates}</p>
              <p className="text-xs text-gray-500 mt-2">🎓 Certificates awarded</p>
            </Card>
            <Card>
              <h3 className="text-gray-500 text-sm mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-yellow-600">${stats.totalRevenue}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hover>
              <div className="text-center">
                <p className="text-4xl mb-2">👥</p>
                <h3 className="font-semibold mb-2">User Management</h3>
                <Link to="/admin/users"><Button variant="primary" size="sm">Manage Users</Button></Link>
              </div>
            </Card>
            <Card hover>
              <div className="text-center">
                <p className="text-4xl mb-2">📚</p>
                <h3 className="font-semibold mb-2">Course Approval</h3>
                <p className="text-sm text-gray-500 mb-4">{stats.pendingCourses} courses pending</p>
                <Link to="/admin/courses?filter=pending"><Button variant="primary" size="sm">Review Courses</Button></Link>
              </div>
            </Card>
            <Card hover>
              <div className="text-center">
                <p className="text-4xl mb-2">🎓</p>
                <h3 className="font-semibold mb-2">Certificates</h3>
                <p className="text-sm text-gray-500 mb-4">{stats.totalCertificates} certificates issued</p>
                <Link to="/admin/certificates"><Button variant="primary" size="sm">View Certificates</Button></Link>
              </div>
            </Card>
          </div>

          <Card>
            <Card.Header><h2 className="text-xl font-semibold">Recent Activity</h2></Card.Header>
            <Card.Body>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                      <div><p className="text-sm">{activity.description}</p><p className="text-xs text-gray-500">{activity.time}</p></div>
                      <span className={`text-xs px-2 py-1 rounded ${activity.status === 'published' ? 'bg-green-100 text-green-700' : activity.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{activity.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-gray-500 py-4">No recent activity</p>}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}
