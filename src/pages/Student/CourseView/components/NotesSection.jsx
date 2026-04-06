import React from 'react'
import NotesPanel from '../../../../components/notes/NotesPanel'
import BookmarksPanel from '../../../../components/notes/BookmarksPanel'

const NotesSection = ({ 
  courseId, 
  currentLesson, 
  refreshBookmarks, 
  videoCurrentTime, 
  onSeek,
  isMobile = false 
}) => {
  return (
    <div className={`${isMobile ? 'space-y-4' : 'bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm'}`}>
      <h2 className="text-xl font-bold mb-4">📝 My Notes & Bookmarks</h2>
      <NotesPanel courseId={courseId} lessonId={currentLesson?.id} />
      <div className={isMobile ? 'mt-4' : 'mt-6'}>
        <BookmarksPanel 
          key={refreshBookmarks}
          courseId={courseId} 
          lessonId={currentLesson?.id}
          currentTime={videoCurrentTime}
          onSeek={onSeek}
        />
      </div>
    </div>
  )
}

export default NotesSection