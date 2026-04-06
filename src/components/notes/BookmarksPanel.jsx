import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Card, Button, Spinner, Input } from '../ui'

export default function BookmarksPanel({ courseId, lessonId, currentTime, onSeek }) {
  const { user } = useAuth()
  const { isMobile } = useTheme()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBookmarkNote, setNewBookmarkNote] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchBookmarks()
  }, [courseId, lessonId])

  async function fetchBookmarks() {
    try {
      let query = supabase
        .from('student_bookmarks')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .order('timestamp', { ascending: true })

      if (lessonId) {
        query = query.eq('lesson_id', lessonId)
      }

      const { data, error } = await query

      if (error) throw error
      setBookmarks(data || [])
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddBookmark() {
    const timeToSave = Math.floor(currentTime || 0)
    if (timeToSave === 0 && currentTime === 0) {
      alert('Please play the video first before adding a bookmark')
      return
    }

    setAdding(true)
    try {
      const { error } = await supabase
        .from('student_bookmarks')
        .insert({
          student_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          timestamp: timeToSave,
          note: newBookmarkNote
        })

      if (error) throw error

      setNewBookmarkNote('')
      fetchBookmarks()
      alert(`Bookmark added at ${formatTime(timeToSave)}`)
    } catch (error) {
      console.error('Error adding bookmark:', error)
      alert('Failed to add bookmark')
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteBookmark(bookmarkId) {
    if (!confirm('Delete this bookmark?')) return

    try {
      const { error } = await supabase
        .from('student_bookmarks')
        .delete()
        .eq('id', bookmarkId)

      if (error) throw error
      fetchBookmarks()
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      alert('Failed to delete bookmark')
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  function handleJumpToTime(timestamp) {
    if (onSeek) {
      onSeek(timestamp)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          🔖 Bookmarks
          <span className="text-sm text-gray-500">({bookmarks.length})</span>
        </h3>
        {lessonId && (
          <div className="flex gap-2 items-center flex-wrap">
            <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Current: {formatTime(currentTime || 0)}
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Note"
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                className="w-24 md:w-32 text-xs"
              />
              <Button size="sm" onClick={handleAddBookmark} disabled={adding}>
                {adding ? '...' : '📌'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <p className="text-4xl mb-2">🔖</p>
            <p className="text-gray-500 text-sm">No bookmarks yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Click "📌" to save your place in the video
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="border rounded-lg p-2 md:p-3 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-blue-600 font-mono font-bold text-xs md:text-sm">
                      ⏱️ {formatTime(bookmark.timestamp)}
                    </span>
                    <button
                      onClick={() => handleJumpToTime(bookmark.timestamp)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                    >
                      Jump
                    </button>
                  </div>
                  {bookmark.note && (
                    <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">
                      "{bookmark.note}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                  title="Delete bookmark"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
