import { useContext, useState, useEffect, useCallback } from 'react'
import CourseContext from '../context/CourseContext'

export const useCourses = () => {
  const context = useContext(CourseContext)
  
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider')
  }
  
  return context
}

// Hook for managing a single course
export const useCourse = (courseId) => {
  const { fetchCourseById, markLessonComplete, getCourseProgress, loading } = useCourses()
  const [course, setCourse] = useState(null)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [courseLoading, setCourseLoading] = useState(true)
  
  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])
  
  const loadCourse = async () => {
    setCourseLoading(true)
    const data = await fetchCourseById(courseId)
    setCourse(data)
    if (data?.lessons?.length > 0) {
      setCurrentLesson(data.lessons[0])
    }
    setCourseLoading(false)
  }
  
  const progress = courseId ? getCourseProgress(courseId) : 0
  
  const completeLesson = async (lessonId) => {
    const result = await markLessonComplete(courseId, lessonId)
    if (result.success) {
      // Refresh course data
      await loadCourse()
    }
    return result
  }
  
  return {
    course,
    currentLesson,
    setCurrentLesson,
    progress,
    completeLesson,
    loading: courseLoading || loading,
    refresh: loadCourse
  }
}

// Hook for teacher's courses
export const useTeacherCourses = () => {
  const { teacherCourses, fetchTeacherCourses, createCourse, updateCourse, deleteCourse, loading } = useCourses()
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  useEffect(() => {
    filterCourses()
  }, [teacherCourses, searchTerm, statusFilter])
  
  const filterCourses = () => {
    let filtered = [...teacherCourses]
    
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter)
    }
    
    setFilteredCourses(filtered)
  }
  
  const stats = {
    total: teacherCourses.length,
    published: teacherCourses.filter(c => c.status === 'published').length,
    draft: teacherCourses.filter(c => c.status === 'draft').length,
    pending: teacherCourses.filter(c => c.status === 'pending').length
  }
  
  return {
    courses: filteredCourses,
    allCourses: teacherCourses,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    refresh: fetchTeacherCourses,
    createCourse,
    updateCourse,
    deleteCourse
  }
}

// Hook for student's enrolled courses
export const useStudentCourses = () => {
  const { enrolledCourses, fetchEnrolledCourses, loading } = useCourses()
  const [filteredCourses, setFilteredCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [progressFilter, setProgressFilter] = useState('all')
  
  useEffect(() => {
    filterCourses()
  }, [enrolledCourses, searchTerm, progressFilter])
  
  const filterCourses = () => {
    let filtered = [...enrolledCourses]
    
    if (searchTerm) {
      filtered = filtered.filter(enrollment =>
        enrollment.courses?.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (progressFilter !== 'all') {
      filtered = filtered.filter(enrollment => {
        if (progressFilter === 'in-progress') return enrollment.progress > 0 && enrollment.progress < 100
        if (progressFilter === 'completed') return enrollment.progress === 100
        if (progressFilter === 'not-started') return enrollment.progress === 0
        return true
      })
    }
    
    setFilteredCourses(filtered)
  }
  
  const stats = {
    total: enrolledCourses.length,
    inProgress: enrolledCourses.filter(e => e.progress > 0 && e.progress < 100).length,
    completed: enrolledCourses.filter(e => e.progress === 100).length,
    notStarted: enrolledCourses.filter(e => e.progress === 0).length
  }
  
  const continueLearning = enrolledCourses
    .filter(e => e.progress > 0 && e.progress < 100)
    .sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed))
  
  return {
    courses: filteredCourses,
    allCourses: enrolledCourses,
    continueLearning,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    progressFilter,
    setProgressFilter,
    refresh: fetchEnrolledCourses
  }
}

// Hook for browsing published courses
export const useBrowseCourses = () => {
  const { courses, fetchPublishedCourses, categories, loading } = useCourses()
  const [filteredCourses, setFilteredCourses] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    type: '',
    price: 'all',
    sort: 'newest'
  })
  
  useEffect(() => {
    applyFilters()
  }, [courses, filters])
  
  useEffect(() => {
    fetchPublishedCourses(filters)
  }, [filters.category, filters.level, filters.type])
  
  const applyFilters = () => {
    let filtered = [...courses]
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    // Price filter
    if (filters.price === 'free') {
      filtered = filtered.filter(course => course.price === 0 || !course.price)
    } else if (filters.price === 'paid') {
      filtered = filtered.filter(course => course.price > 0)
    }
    
    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
        case 'popular':
          return (b.enrolled_students || 0) - (a.enrolled_students || 0)
        default:
          return 0
      }
    })
    
    setFilteredCourses(filtered)
  }
  
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      level: '',
      type: '',
      price: 'all',
      sort: 'newest'
    })
  }
  
  return {
    courses: filteredCourses,
    allCourses: courses,
    filters,
    updateFilter,
    resetFilters,
    categories,
    loading
  }
}
