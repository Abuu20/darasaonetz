import { useCallback } from 'react'
import { supabase } from '../../../../supabase/client'  // Fixed path

export const useLessonCompletion = (user, courseId, enrollment, completedLessons, setCompletedLessons, setEnrollment, fetchCourseData, quizResults, quizzes, showSuccess, showError) => {
  
  const markLessonComplete = useCallback(async (lessonId) => {
    try {
      await supabase
        .from('lesson_completions')
        .insert({
          student_id: user.id,
          lesson_id: lessonId,
          course_id: courseId
        })

      const newCompleted = [...completedLessons, lessonId]
      setCompletedLessons(newCompleted)

      const totalLessons = enrollment?.total_lessons || 1
      const lessonsProgress = (newCompleted.length / totalLessons) * 70
      const completedQuizzesCount = Object.values(quizResults).filter(r => r?.passed === true).length
      const quizProgressContribution = quizzes.length > 0 
        ? (completedQuizzesCount / quizzes.length) * 30 
        : 0
      const progress = Math.min(100, lessonsProgress + quizProgressContribution)

      await supabase
        .from('enrollments')
        .update({
          progress: progress,
          completed_lessons: newCompleted,
          last_accessed: new Date().toISOString()
        })
        .eq('id', enrollment.id)

      setEnrollment({ ...enrollment, progress: progress, completed_lessons: newCompleted })

      showSuccess('Lesson completed!')

      if (progress === 100) {
        await fetchCourseData()
      }

    } catch (error) {
      console.error('Error marking lesson complete:', error)
      showError('Failed to mark lesson complete')
    }
  }, [user, courseId, enrollment, completedLessons, setCompletedLessons, setEnrollment, quizResults, quizzes, fetchCourseData, showSuccess, showError])

  return { markLessonComplete }
}