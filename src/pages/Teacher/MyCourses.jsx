import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { CourseCard } from '../../components/courses'
import { Card, Input, Button, Spinner } from '../../components/ui'

export default function TeacherMyCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    pending: 0
  })

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user])

  useEffect(() => {
    filterCourses()
  }, [searchTerm, courses])

  async function fetchCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          lessons (count),
          enrollments (count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCourses(data || [])
      setFilteredCourses(data || [])

      // Calculate stats
      const published = data?.filter(c => c.status === 'published').length || 0
      const draft = data?.filter(c => c.status === 'draft').length || 0
      const pending = data?.filter(c => c.status === 'pending').length || 0

      setStats({
        total: data?.length || 0,
        published,
        draft,
        pending
      })

    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterCourses() {
    let filtered = [...courses]

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCourses(filtered)
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
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Link to="/teacher/courses/new">
          <Button variant="primary">+ Create New Course</Button>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-gray-500 text-sm">Total Courses</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card>
          <p className="text-gray-500 text-sm">Published</p>
          <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        </Card>
        <Card>
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </Card>
        <Card>
          <p className="text-gray-500 text-sm">Drafts</p>
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <Input
          placeholder="Search your courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} isTeacher />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
            <Link to="/teacher/courses/new">
              <Button variant="primary">Create Your First Course</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
