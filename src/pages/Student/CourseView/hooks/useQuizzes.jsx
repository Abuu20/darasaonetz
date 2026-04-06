// src/pages/Student/CourseView/hooks/useQuizzes.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../../../../supabase/client'
import { isDateInFuture, isDateInPast, getDetailedTimeRemaining, formatLocalTime } from '../utils/timeHelpers'

export const useQuizzes = (courseId, user) => {
  const [quizzes, setQuizzes] = useState([])
  const [quizResults, setQuizResults] = useState({})
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [quizTakingState, setQuizTakingState] = useState({})
  const [showUpcomingQuizzes, setShowUpcomingQuizzes] = useState(true)
  const [studentTimezone, setStudentTimezone] = useState('UTC')
  
  const quizSubscriptionRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const isMounted = useRef(true)
  const dataFetchedRef = useRef(false) // Track if data has been fetched
  const currentCourseIdRef = useRef(courseId)

  const isQuizAvailable = useCallback((quiz) => {
    const now = new Date()
    if (quiz.status === 'archived') return false
    if (quiz.status !== 'published') return false
    if (quiz.publish_at && isDateInFuture(quiz.publish_at)) return false
    if (quiz.unpublish_at && isDateInPast(quiz.unpublish_at)) return false
    return true
  }, [])

  const getTimeRemaining = useCallback((quiz) => {
    if (quiz.publish_at && isDateInFuture(quiz.publish_at)) {
      const remaining = getDetailedTimeRemaining(quiz.publish_at)
      if (remaining) {
        return { type: 'scheduled', ...remaining, targetDate: quiz.publish_at }
      }
    }
    if (quiz.unpublish_at && isDateInFuture(quiz.unpublish_at) && isQuizAvailable(quiz)) {
      const remaining = getDetailedTimeRemaining(quiz.unpublish_at)
      if (remaining) {
        return { type: 'expiring', ...remaining, targetDate: quiz.unpublish_at }
      }
    }
    return null
  }, [isQuizAvailable])

  const getQuizStatusMessage = useCallback((quiz) => {
    if (quiz.status === 'archived') return 'This quiz is archived'
    if (quiz.publish_at && isDateInFuture(quiz.publish_at)) {
      const localTime = formatLocalTime(quiz.publish_at)
      return `Available from ${localTime}`
    }
    if (quiz.unpublish_at && isDateInPast(quiz.unpublish_at)) {
      const localTime = formatLocalTime(quiz.unpublish_at)
      return `This quiz expired on ${localTime}`
    }
    if (quiz.status !== 'published') return 'This quiz is not yet available'
    return null
  }, [])

  const fetchQuizzes = useCallback(async () => {
    if (!user) return
    
    // Skip if data already fetched for this course
    if (dataFetchedRef.current && currentCourseIdRef.current === courseId) {
      console.log('Quiz data already fetched, skipping refetch')
      return
    }
    
    console.log('fetchQuizzes called for course:', courseId)
    
    try {
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })

      if (quizzesError) {
        console.error('Error fetching quizzes:', quizzesError)
        return
      }

      console.log('Quizzes fetched:', quizzesData?.length || 0)

      const processedQuizzes = (quizzesData || [])
        .map(quiz => ({
          ...quiz,
          isCurrentlyAvailable: isQuizAvailable(quiz),
          timeRemaining: getTimeRemaining(quiz),
          availabilityMessage: getQuizStatusMessage(quiz)
        }))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      
      let resultsMap = {}
      if (quizzesData && quizzesData.length > 0) {
        for (const quiz of quizzesData) {
          const { data: attempt } = await supabase
            .from('quiz_attempts')
            .select('score, passed, completed_at')
            .eq('quiz_id', quiz.id)
            .eq('student_id', user.id)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (attempt) {
            resultsMap[quiz.id] = {
              score: attempt.score,
              passed: attempt.passed,
              completedAt: attempt.completed_at
            }
          }
        }
      }

      if (isMounted.current) {
        setQuizzes(processedQuizzes)
        setQuizResults(resultsMap)
        dataFetchedRef.current = true
        currentCourseIdRef.current = courseId
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }, [courseId, user, isQuizAvailable, getTimeRemaining, getQuizStatusMessage])

  const refreshData = useCallback(async () => {
    if (!user) return
    
    // Allow refresh even after initial fetch (for real-time updates)
    try {
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })

      if (quizzesError) {
        console.error('Error refreshing quizzes:', quizzesError)
        return
      }

      const processedQuizzes = (quizzesData || [])
        .map(quiz => ({
          ...quiz,
          isCurrentlyAvailable: isQuizAvailable(quiz),
          timeRemaining: getTimeRemaining(quiz),
          availabilityMessage: getQuizStatusMessage(quiz)
        }))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      
      let resultsMap = {}
      if (quizzesData && quizzesData.length > 0) {
        for (const quiz of quizzesData) {
          const { data: attempt } = await supabase
            .from('quiz_attempts')
            .select('score, passed, completed_at')
            .eq('quiz_id', quiz.id)
            .eq('student_id', user.id)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (attempt) {
            resultsMap[quiz.id] = {
              score: attempt.score,
              passed: attempt.passed,
              completedAt: attempt.completed_at
            }
          }
        }
      }

      if (isMounted.current) {
        setQuizzes(processedQuizzes)
        setQuizResults(resultsMap)
      }
    } catch (error) {
      console.error('Error refreshing quizzes:', error)
    }
  }, [courseId, user, isQuizAvailable, getTimeRemaining, getQuizStatusMessage])

  const updateCountdowns = useCallback(() => {
    setQuizzes(prevQuizzes => {
      const updatedQuizzes = [...prevQuizzes]
      let needsUpdate = false
      
      updatedQuizzes.forEach((quiz, index) => {
        const timeRemaining = getTimeRemaining(quiz)
        if (timeRemaining) {
          if (JSON.stringify(quiz.timeRemaining) !== JSON.stringify(timeRemaining)) {
            updatedQuizzes[index] = { ...quiz, timeRemaining }
            needsUpdate = true
          }
        } else if (quiz.timeRemaining) {
          updatedQuizzes[index] = { ...quiz, timeRemaining: null }
          needsUpdate = true
        }
      })
      
      return needsUpdate ? updatedQuizzes : prevQuizzes
    })
  }, [getTimeRemaining])

  const startQuiz = useCallback((quizId) => {
    const quiz = quizzes.find(q => q.id === quizId)
    if (!isQuizAvailable(quiz)) {
      const message = getQuizStatusMessage(quiz)
      console.error(message || 'This quiz is not available')
      return
    }
    setQuizTakingState(prev => ({ ...prev, [quizId]: true }))
  }, [quizzes, isQuizAvailable, getQuizStatusMessage])

  const resetQuiz = useCallback((quizId) => {
    setQuizTakingState(prev => ({ ...prev, [quizId]: false }))
  }, [])

  const handleQuizComplete = useCallback(async (quizId, passed, score) => {
    await refreshData()
    return { passed, score }
  }, [refreshData])

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (quizSubscriptionRef.current) {
        supabase.removeChannel(quizSubscriptionRef.current)
      }
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [])

  // Real-time subscription
  useEffect(() => {
    if (!courseId) return
    
    const setupSubscription = async () => {
      try {
        quizSubscriptionRef.current = supabase
          .channel('quiz-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'quizzes',
              filter: `course_id=eq.${courseId}`
            },
            () => {
              refreshData()
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Error setting up real-time subscription:', error)
      }
    }
    
    setupSubscription()
    
    return () => {
      if (quizSubscriptionRef.current) {
        supabase.removeChannel(quizSubscriptionRef.current)
      }
    }
  }, [courseId, refreshData])

  // Countdown timer
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      updateCountdowns()
    }, 1000)
    
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [updateCountdowns])

  // Background polling (less frequent, only every 30 seconds)
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      refreshData()
    }, 30000)
    
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [refreshData])

  // Timezone detection
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setStudentTimezone(detectedTimezone)
  }, [])

  const availableQuizzes = useMemo(() => quizzes.filter(q => isQuizAvailable(q)), [quizzes, isQuizAvailable])
  const upcomingQuizzes = useMemo(() => quizzes.filter(q => q.publish_at && isDateInFuture(q.publish_at)), [quizzes])
  const completedQuizzesCount = Object.values(quizResults).filter(r => r?.passed === true).length

  // Initial fetch
  useEffect(() => {
    // Reset fetch flag when courseId changes
    if (currentCourseIdRef.current !== courseId) {
      dataFetchedRef.current = false
    }
    fetchQuizzes()
  }, [fetchQuizzes, courseId])

  return {
    quizzes,
    quizResults,
    currentQuizIndex,
    setCurrentQuizIndex,
    quizTakingState,
    showUpcomingQuizzes,
    setShowUpcomingQuizzes,
    studentTimezone,
    availableQuizzes,
    upcomingQuizzes,
    completedQuizzesCount,
    isQuizAvailable,
    getTimeRemaining,
    getQuizStatusMessage,
    startQuiz,
    resetQuiz,
    handleQuizComplete,
    refreshData
  }
}