import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Input, Select, Tabs } from '../../components/ui'
import RatingStars from '../../components/ui/RatingStars'

export default function CourseApproval() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adminCheck, setAdminCheck] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    draft: 0
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (adminCheck) {
      fetchCourses()
    }
  }, [adminCheck])

  useEffect(() => {
    filterCourses()
    calculateStats()
  }, [searchTerm, statusFilter, courses])

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (profile?.role !== 'admin') {
        alert('Access denied. Admin only.')
        navigate('/')
        return
      }

      setAdminCheck(true)
    } catch (error) {
      console.error('Error checking admin access:', error)
      navigate('/')
    }
  }

  async function fetchCourses() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          profiles:teacher_id (
            full_name,
            email
          ),
          categories (
            name
          ),
          lessons (count),
          enrollments (count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched courses:', data)
      setCourses(data || [])
      setFilteredCourses(data || [])
      
      // Calculate stats
      const pending = data?.filter(c => c.status === 'pending').length || 0
      const published = data?.filter(c => c.status === 'published').length || 0
      const draft = data?.filter(c => c.status === 'draft').length || 0
      
      setStats({
        total: data?.length || 0,
        pending,
        published,
        draft
      })
      
    } catch (error) {
      console.error('Error fetching courses:', error)
      alert('Failed to fetch courses: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function filterCourses() {
    let filtered = [...courses]

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCourses(filtered)
  }

  function calculateStats() {
    const pending = courses.filter(c => c.status === 'pending').length
    const published = courses.filter(c => c.status === 'published').length
    const draft = courses.filter(c => c.status === 'draft').length
    
    setStats({
      total: courses.length,
      pending,
      published,
      draft
    })
  }

  async function handleApprove(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'published' })
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.map(course =>
        course.id === courseId ? { ...course, status: 'published' } : course
      ))
      
      alert('Course approved and published successfully')
    } catch (error) {
      console.error('Error approving course:', error)
      alert('Failed to approve course: ' + error.message)
    }
  }

  async function handleReject(courseId) {
    const reason = prompt('Please enter reason for rejection:')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({ 
          status: 'draft',
          rejection_reason: reason 
        })
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.map(course =>
        course.id === courseId ? { ...course, status: 'draft' } : course
      ))
      
      alert('Course rejected and returned to draft')
    } catch (error) {
      console.error('Error rejecting course:', error)
      alert('Failed to reject course: ' + error.message)
    }
  }

  async function handleUnpublish(courseId) {
    if (!confirm('Are you sure you want to unpublish this course?')) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: 'draft' })
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.map(course =>
        course.id === courseId ? { ...course, status: 'draft' } : course
      ))
      
      alert('Course unpublished successfully')
    } catch (error) {
      console.error('Error unpublishing course:', error)
      alert('Failed to unpublish course: ' + error.message)
    }
  }

  async function handleDelete(courseId) {
    if (!confirm('⚠️ WARNING: This will permanently delete the course and ALL related data including:\n- All lessons\n- All enrollments\n- All reviews\n- All quiz attempts\n\nThis action CANNOT be undone. Are you sure?')) return

    try {
      // With CASCADE DELETE, this will automatically delete all related records
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      setCourses(courses.filter(course => course.id !== courseId))
      alert('Course deleted successfully')
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const tabs = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'pending', label: `Pending (${stats.pending})` },
    { id: 'published', label: `Published (${stats.published})` },
    { id: 'draft', label: `Drafts (${stats.draft})` }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Darasaone Admin</h1>
            <div className="flex gap-4">
              <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-red-600">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-600 dark:text-gray-300 hover:text-red-600">Users</Link>
              <Link to="/admin/courses" className="text-red-600 font-medium">Courses</Link>
              <Link to="/admin/certificates" className="text-gray-600 dark:text-gray-300 hover:text-red-600">Certificates</Link>
              <Link to="/admin/reports" className="text-gray-600 dark:text-gray-300 hover:text-red-600">Reports</Link>
              <Link to="/admin/settings" className="text-gray-600 dark:text-gray-300 hover:text-red-600">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Course Management</h1>
            <p className="text-red-100">Review, approve, and manage all courses on the platform</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Courses</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
            </Card>
            <Card>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">Pending Review</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
            </Card>
            <Card>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">Published</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
            </Card>
            <Card>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-1">Drafts</h3>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.draft}</p>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Search Courses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or teacher..."
              />
              <Select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Courses' },
                  { value: 'pending', label: 'Pending Review' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Drafts' }
                ]}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </Card>

          {/* Courses List */}
          <div className="space-y-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => {
                // Calculate average rating if reviews exist
                const courseReviews = course.course_reviews || []
                const avgRating = courseReviews.length > 0 
                  ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length 
                  : 0
                
                return (
                  <Card key={course.id} hover>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Course Thumbnail */}
                      <div className="w-full md:w-48 h-32 bg-gradient-to-r from-red-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          '📚'
                        )}
                      </div>
                      
                      {/* Course Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold">{course.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              By {course.profiles?.full_name || 'Unknown Teacher'} • {course.categories?.name || 'Uncategorized'} • {course.level}
                            </p>
                            {avgRating > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <RatingStars rating={avgRating} readonly size="sm" />
                                <span className="text-xs text-gray-500">
                                  ({courseReviews.length} reviews)
                                </span>
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            course.status === 'published' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                            course.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                          }`}>
                            {course.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                          {course.description || 'No description provided'}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>💰 Price: {course.price > 0 ? `TZS ${parseFloat(course.price).toLocaleString()}` : 'Free'}</span>
                          <span>📅 Created: {new Date(course.created_at).toLocaleDateString()}</span>
                          <span>📧 Teacher: {course.profiles?.email || 'No email'}</span>
                          <span>📚 Lessons: {course.lessons?.count || 0}</span>
                          <span>👥 Students: {course.enrollments?.count || 0}</span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          {course.status === 'pending' && (
                            <>
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={() => handleApprove(course.id)}
                              >
                                ✓ Approve
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleReject(course.id)}
                              >
                                ✗ Reject
                              </Button>
                            </>
                          )}
                          
                          {course.status === 'published' && (
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={() => handleUnpublish(course.id)}
                            >
                              📥 Unpublish
                            </Button>
                          )}
                          
                          {course.status === 'draft' && (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleApprove(course.id)}
                            >
                              ✓ Publish
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/teacher/courses/${course.id}/lessons`, '_blank')}
                          >
                            📚 View Lessons
                          </Button>
                          
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDelete(course.id)}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <Card>
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">📚</p>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Courses will appear here once teachers create them'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
