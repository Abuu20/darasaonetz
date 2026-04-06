import { useState, useCallback } from 'react'
import { supabase } from '../../../../supabase/client'  // Fixed path

export const useBookmarks = (user, courseId, currentLesson, showSuccess, showError) => {
  const [refreshBookmarks, setRefreshBookmarks] = useState(0)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)

  const handleVideoTimeUpdate = useCallback((time) => {
    setVideoCurrentTime(time)
  }, [])

  const handleSeek = useCallback((time) => {
    setVideoCurrentTime(time)
  }, [])

  const handleBookmark = useCallback(async (time, note) => {
    try {
      const { error } = await supabase
        .from('student_bookmarks')
        .insert({
          student_id: user.id,
          course_id: courseId,
          lesson_id: currentLesson?.id,
          timestamp: Math.floor(time),
          note: note || ''
        })

      if (error) throw error
      
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      
      showSuccess(`Bookmark added at ${formatTime(time)}`)
      setRefreshBookmarks(prev => prev + 1)
      
    } catch (error) {
      console.error('Error adding bookmark:', error)
      showError('Failed to add bookmark')
    }
  }, [user, courseId, currentLesson?.id, showSuccess, showError])

  return {
    refreshBookmarks,
    videoCurrentTime,
    handleVideoTimeUpdate,
    handleSeek,
    handleBookmark
  }
}