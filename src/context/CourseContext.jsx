import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import { useAuth } from './AuthContext'

const CourseContext = createContext({})

export const useCourses = () => {
  return useContext(CourseContext)
}

export const CourseProvider = ({ children }) => {
  const { user, isTeacher, isStudent } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [teacherCourses, setTeacherCourses] = useState([])
  const [currentCourse, setCurrentCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch user-specific courses when user changes
  useEffect(() => {
    if (user) {
      if (isStudent) {
        fetchEnrolledCourses()
      }
      if (isTeacher) {
        fetchTeacherCourses()
      }
    }
  }, [user, isStudent, isTeacher])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError(error.message)
    }
  }

  const fetchEnrolledCourses = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            *,
            categories (*),
            profiles!courses_teacher_id_fkey (*),
            lessons (count)
          )
        `)
        .eq('student_id', user.id)
        .order('last_accessed', { ascending: false })

      if (error) throw error
      setEnrolledCourses(data || [])
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherCourses = async () => {
    if (!user) return
    
    setLoading(true)
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
      setTeacherCourses(data || [])
    } catch (error) {
      console.error('Error fetching teacher courses:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublishedCourses = async (filters = {}) => {
    setLoading(true)
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          profiles!courses_teacher_id_fkey (*),
          lessons (count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.level) {
        query = query.eq('level', filters.level)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setCourses(data || [])
      return data
    } catch (error) {
      console.error('Error fetching published courses:', error)
      setError(error.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseById = async (courseId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (*),
          profiles!courses_teacher_id_fkey (*),
          lessons (*)
        `)
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCurrentCourse(data)
      return data
    } catch (error) {
      console.error('Error fetching course:', error)
      setError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async (courseData) => {
    try {
      if (!user) throw new Error('You must be logged in')

      const slug = courseData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const { data, error } = await supabase
        .from('courses')
        .insert([{
          ...courseData,
          teacher_id: user.id,
          slug,
          enrolled_students: 0,
          rating: 0
        }])
        .select()

      if (error) throw error

      // Refresh teacher courses
      await fetchTeacherCourses()
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error creating course:', error)
      return { success: false, error: error.message }
    }
  }

  const updateCourse = async (courseId, updates) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)

      if (error) throw error

      // Refresh teacher courses
      await fetchTeacherCourses()
      return { success: true }
    } catch (error) {
      console.error('Error updating course:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteCourse = async (courseId) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error

      // Refresh teacher courses
      await fetchTeacherCourses()
      return { success: true }
    } catch (error) {
      console.error('Error deleting course:', error)
      return { success: false, error: error.message }
    }
  }

  const enrollInCourse = async (courseId) => {
    try {
      if (!user) throw new Error('You must be logged in')

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (existing) {
        return { success: false, error: 'Already enrolled in this course' }
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0,
          completed_lessons: []
        })

      if (error) throw error

      // Update enrolled courses count
      await supabase.rpc('increment_enrolled_students', { course_id: courseId })

      // Refresh enrolled courses
      await fetchEnrolledCourses()
      return { success: true }
    } catch (error) {
      console.error('Error enrolling in course:', error)
      return { success: false, error: error.message }
    }
  }

  const markLessonComplete = async (courseId, lessonId) => {
    try {
      if (!user) throw new Error('You must be logged in')

      // Find enrollment
      const enrollment = enrolledCourses.find(e => e.course_id === courseId)
      if (!enrollment) throw new Error('Not enrolled in this course')

      // Check if already completed
      if (enrollment.completed_lessons?.includes(lessonId)) {
        return { success: true }
      }

      // Add to completed lessons
      const updatedCompleted = [...(enrollment.completed_lessons || []), lessonId]

      // Get total lessons count
      const { data: course } = await supabase
        .from('courses')
        .select('lessons(count)')
        .eq('id', courseId)
        .single()

      const totalLessons = course?.lessons?.[0]?.count || 1
      const progress = (updatedCompleted.length / totalLessons) * 100

      // Update enrollment
      const { error } = await supabase
        .from('enrollments')
        .update({
          progress,
          completed_lessons: updatedCompleted,
          last_accessed: new Date().toISOString(),
          completed_at: progress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id)

      if (error) throw error

      // Add lesson completion record
      await supabase
        .from('lesson_completions')
        .insert({
          student_id: user.id,
          lesson_id: lessonId,
          course_id: courseId
        })

      // Refresh enrolled courses
      await fetchEnrolledCourses()
      return { success: true }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
      return { success: false, error: error.message }
    }
  }

  const getCourseProgress = (courseId) => {
    const enrollment = enrolledCourses.find(e => e.course_id === courseId)
    return enrollment?.progress || 0
  }

  const value = {
    // State
    courses,
    enrolledCourses,
    teacherCourses,
    currentCourse,
    categories,
    loading,
    error,

    // Actions
    fetchPublishedCourses,
    fetchCourseById,
    fetchEnrolledCourses,
    fetchTeacherCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    markLessonComplete,
    getCourseProgress,

    // Helpers
    isEnrolled: (courseId) => enrolledCourses.some(e => e.course_id === courseId),
    getEnrollment: (courseId) => enrolledCourses.find(e => e.course_id === courseId)
  }

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  )
}

export default CourseContext
