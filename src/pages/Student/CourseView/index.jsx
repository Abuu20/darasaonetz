// src/pages/Student/CourseView/index.jsx
import React, { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { Spinner } from '../../../components/ui'
import { useCourseData } from './hooks/useCourseData'
import { useQuizzes } from './hooks/useQuizzes'
import { useLessonCompletion } from './hooks/useLessonCompletion'
import { useBookmarks } from './hooks/useBookmarks'
import MobileLayout from './components/MobileLayout'
import DesktopLayout from './components/DesktopLayout'

export default function CourseView() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { showSuccess, showError, isMobile } = useTheme()
  
  console.log('CourseView rendering for course:', courseId)
  
  // Course data hook
  const {
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
    fetchCourseData
  } = useCourseData(courseId, user)

  // Quizzes hook
  const {
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
    handleQuizComplete
  } = useQuizzes(courseId, user)

  // Bookmarks hook
  const {
    refreshBookmarks,
    videoCurrentTime,
    handleVideoTimeUpdate,
    handleSeek,
    handleBookmark
  } = useBookmarks(user, courseId, currentLesson, showSuccess, showError)

  // Lesson completion hook
  const { markLessonComplete } = useLessonCompletion(
    user, courseId, enrollment, completedLessons, 
    setCompletedLessons, setEnrollment, fetchCourseData, 
    quizResults, quizzes, showSuccess, showError
  )

  const [activeView, setActiveView] = useState('lesson')
  const [selectedTopic, setSelectedTopic] = useState(null)

  // Calculate progress stats
  const completedLessonsCount = completedLessons.length
  const lessonsCount = lessons.length
  const totalProgress = enrollment?.progress || 0
  const isComplete = enrollment?.progress === 100

  // Navigation items
  const navigationItems = [
    { id: 'lesson', label: 'Lessons', icon: '📖', badge: `${completedLessonsCount}/${lessonsCount}` },
    { id: 'notes', label: 'Notes', icon: '📝' },
    ...(quizzes.length > 0 ? [{ id: 'quiz', label: 'Quizzes', icon: '📝', badge: `${completedQuizzesCount}/${quizzes.length}` }] : []),
    { id: 'forum', label: 'Forum', icon: '💬' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' }
  ]

  const onReviewSubmitted = useCallback(() => {
    setHasReviewed(true)
    fetchCourseData()
  }, [setHasReviewed, fetchCourseData])

  console.log('Loading state:', loading, 'Course exists:', !!course)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Course not found</p>
        </div>
      </div>
    )
  }

  const layoutProps = {
    course,
    lessons,
    currentLesson,
    setCurrentLesson,
    completedLessons,
    totalProgress,
    activeView,
    setActiveView,
    navigationItems,
    lessonMaterials,
    onVideoTimeUpdate: handleVideoTimeUpdate,
    onBookmark: handleBookmark,
    onMarkComplete: markLessonComplete,
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
    refreshBookmarks,
    videoCurrentTime,
    onSeek: handleSeek,
    selectedTopic,
    setSelectedTopic,
    hasReviewed,
    enrollment,
    onReviewSubmitted,
    fetchCourseData,
    isComplete,
    certificateIssued,
    user,
    courseId
  }

  if (isMobile) {
    return <MobileLayout {...layoutProps} />
  }

  return <DesktopLayout {...layoutProps} />
}