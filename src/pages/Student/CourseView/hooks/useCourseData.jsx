// src/pages/Student/CourseView/hooks/useCourseData.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../../supabase/client'

export const useCourseData = (courseId, user) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [completedLessons, setCompletedLessons] = useState([])
  const [hasReviewed, setHasReviewed] = useState(false)
  const [certificateIssued, setCertificateIssued] = useState(false)
  const [lessonMaterials, setLessonMaterials] = useState([])
  
  const isMounted = useRef(true)
  const dataFetchedRef = useRef(false) // Track if data has been fetched
  const currentCourseIdRef = useRef(courseId)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchCourseData = useCallback(async (silent = false) => {
    // Skip if data already fetched for this course
    if (dataFetchedRef.current && currentCourseIdRef.current === courseId) {
      console.log('Data already fetched, skipping refetch')
      return
    }
    
    console.log('fetchCourseData called for course:', courseId)
    
    try {
      if (!user) {
        console.log('No user, navigating to login')
        navigate('/login')
        return
      }

      if (!silent) {
        setLoading(true)
      }

      // Fetch enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (enrollmentError || !enrollmentData) {
        console.log('No enrollment found, navigating to browse')
        navigate('/student/browse')
        return
      }

      console.log('Enrollment found:', enrollmentData)

      // Fetch course with lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          profiles (full_name, avatar_url),
          lessons (id, title, description, video_url, content, duration, order_index, is_free)
        `)
        .eq('id', courseId)
        .single()

      if (courseError) {
        console.error('Course fetch error:', courseError)
        throw courseError
      }
      
      console.log('Course data fetched:', courseData?.title)
      
      const sortedLessons = courseData.lessons?.sort((a, b) => a.order_index - b.order_index) || []
      
      // Fetch completed lessons
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)

      const completed = completions?.map(c => c.lesson_id) || []

      // Check for review
      const { data: review } = await supabase
        .from('course_reviews')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .maybeSingle()

      const hasReview = !!review

      // Check for certificate
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()
      
      const hasCert = !!existingCert

      if (isMounted.current) {
        setCourse(courseData)
        setLessons(sortedLessons)
        setEnrollment(enrollmentData)
        setCompletedLessons(completed)
        setHasReviewed(hasReview)
        setCertificateIssued(hasCert)
        
        // Set current lesson if none exists and we have lessons
        if (!currentLesson && sortedLessons.length > 0) {
          setCurrentLesson(sortedLessons[0])
        }
        
        setLoading(false)
        dataFetchedRef.current = true
        currentCourseIdRef.current = courseId
      }

    } catch (error) {
      console.error('Error fetching course:', error)
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [courseId, user, navigate, currentLesson])

  const fetchLessonMaterials = useCallback(async (lessonId) => {
    if (!lessonId) return
    
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true })

      if (error) {
        if (error.code === 'PGRST205') {
          setLessonMaterials([])
          return
        }
        throw error
      }
      setLessonMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
      setLessonMaterials([])
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    // Reset fetch flag when courseId changes
    if (currentCourseIdRef.current !== courseId) {
      dataFetchedRef.current = false
    }
    fetchCourseData()
  }, [fetchCourseData, courseId])

  // Fetch materials when lesson changes
  useEffect(() => {
    if (currentLesson?.id) {
      fetchLessonMaterials(currentLesson.id)
    }
  }, [currentLesson?.id, fetchLessonMaterials])

  return {
    loading,
    course,
    lessons,
    currentLesson,
    setCurrentLesson,
    enrollment,
    setEnrollment,
    completedLessons,
    setCompletedLessons,
    hasReviewed,
    setHasReviewed,
    certificateIssued,
    lessonMaterials,
    fetchCourseData,
    fetchLessonMaterials
  }
}