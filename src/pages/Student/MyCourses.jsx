import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import CourseCard from '../../components/courses/CourseCard'

export default function MyCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, in-progress, completed

  useEffect(() => {
    fetchMyCourses()
  }, [])

  async function fetchMyCourses() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            level,
            teacher_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('last_accessed', { ascending: false })

      if (error) throw error
      setCourses(data || [])

    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    if (filter === 'in-progress') return course.progress > 0 && course.progress < 100
    if (filter === 'completed') return course.progress === 100
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading your courses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Link 
          to="/student/browse" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Browse More Courses
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {['all', 'in-progress', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-t-lg capitalize ${
              filter === tab 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((enrollment) => (
            <CourseCard 
              key={enrollment.id}
              course={enrollment.courses}
              progress={enrollment.progress}
              enrollmentId={enrollment.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No courses found</p>
          <Link 
            to="/student/browse" 
            className="text-blue-600 hover:underline"
          >
            Browse available courses
          </Link>
        </div>
      )}
    </div>
  )
}
