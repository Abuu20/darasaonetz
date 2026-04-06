import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Card, Button, Spinner, Input } from '../../components/ui'
import CourseCard from '../../components/courses/CourseCard'

export default function MyCourses() {
  const { user } = useAuth()
  const { showSuccess, showError } = useTheme()
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      fetchMyCourses()
    }
  }, [user])

  async function fetchMyCourses() {
    try {
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
            price,
            average_rating,
            review_count,
            status,
            teacher_id,
            profiles!courses_teacher_id_fkey (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('last_accessed', { ascending: false })

      if (error) throw error
      
      const validCourses = data?.filter(enrollment => 
        enrollment.courses !== null && enrollment.courses.status === 'published'
      ) || []
      
      setCourses(validCourses)
    } catch (error) {
      console.error('Error fetching courses:', error)
      showError(t('common.loadingError'))
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    if (filter === 'in-progress') return course.progress > 0 && course.progress < 100
    if (filter === 'completed') return course.progress === 100
    if (filter === 'not-started') return course.progress === 0
    
    if (searchTerm) {
      return course.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('student.myCourses.title')}</h1>
        <Link to="/student/browse" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {t('student.myCourses.browseMore')}
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('student.myCourses.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('student.myCourses.all')}
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'in-progress' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('student.myCourses.inProgress')}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'completed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('student.myCourses.completed')}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          {t('student.myCourses.showing')} {filteredCourses.length} {t('student.myCourses.of')} {courses.length} {t('student.myCourses.courses')}
        </p>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((enrollment) => {
            const course = enrollment.courses
            if (!course) return null
            
            return (
              <CourseCard 
                key={enrollment.id}
                course={course}
                progress={enrollment.progress}
                enrollmentId={enrollment.id}
              />
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-500 text-lg mb-4">
              {searchTerm ? t('student.myCourses.noMatching') : t('student.myCourses.noEnrolled')}
            </p>
            {!searchTerm && (
              <Link to="/student/browse">
                <Button variant="primary">{t('student.myCourses.browseMore')}</Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}