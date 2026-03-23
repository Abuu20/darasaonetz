import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Input, Modal, Spinner } from '../ui'

export default function NotesPanel({ courseId, lessonId }) {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: '#fef3c7' })
  const [submitting, setSubmitting] = useState(false)

  const colors = [
    { value: '#fef3c7', label: 'Yellow', class: 'bg-yellow-50' },
    { value: '#e0f2fe', label: 'Blue', class: 'bg-blue-50' },
    { value: '#dcfce7', label: 'Green', class: 'bg-green-50' },
    { value: '#ffe4e6', label: 'Pink', class: 'bg-pink-50' },
    { value: '#f1f5f9', label: 'Gray', class: 'bg-gray-50' },
  ]

  useEffect(() => {
    fetchNotes()
  }, [courseId, lessonId])

  async function fetchNotes() {
    try {
      let query = supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (lessonId) {
        query = query.eq('lesson_id', lessonId)
      }

      const { data, error } = await query

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNote(e) {
    e.preventDefault()
    if (!noteForm.title.trim()) return

    setSubmitting(true)
    try {
      const noteData = {
        student_id: user.id,
        course_id: courseId,
        lesson_id: lessonId || null,
        title: noteForm.title,
        content: noteForm.content,
        color: noteForm.color
      }

      if (editingNote) {
        const { error } = await supabase
          .from('student_notes')
          .update(noteData)
          .eq('id', editingNote.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('student_notes')
          .insert([noteData])

        if (error) throw error
      }

      setShowNoteModal(false)
      setEditingNote(null)
      setNoteForm({ title: '', content: '', color: '#fef3c7' })
      fetchNotes()
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteNote(noteId) {
    if (!confirm('Delete this note?')) return

    try {
      const { error } = await supabase
        .from('student_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  async function handleTogglePin(note) {
    try {
      const { error } = await supabase
        .from('student_notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id)

      if (error) throw error
      fetchNotes()
    } catch (error) {
      console.error('Error pinning note:', error)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📝 My Notes
          <span className="text-sm text-gray-500">({notes.length})</span>
        </h3>
        <Button size="sm" onClick={() => setShowNoteModal(true)}>
          + Add Note
        </Button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <p className="text-4xl mb-2">📝</p>
            <p className="text-gray-500">No notes yet</p>
            <p className="text-sm text-gray-400">Take notes to remember important points</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const colorStyle = colors.find(c => c.value === note.color) || colors[0]
            return (
              <div key={note.id} className={`${colorStyle.class} rounded-lg p-3 border`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {note.is_pinned && <span className="text-yellow-500">📌</span>}
                      <h4 className="font-medium">{note.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => {
                        setEditingNote(note)
                        setNoteForm({
                          title: note.title,
                          content: note.content,
                          color: note.color
                        })
                        setShowNoteModal(true)
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 hover:bg-gray-200 rounded text-red-500"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => {
        setShowNoteModal(false)
        setEditingNote(null)
        setNoteForm({ title: '', content: '', color: '#fef3c7' })
      }} title={editingNote ? 'Edit Note' : 'Add Note'}>
        <form onSubmit={handleSaveNote} className="space-y-4">
          <Input
            label="Title"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            placeholder="Note title"
            required
          />
          <div>
            <label className="block text-gray-700 mb-2">Content</label>
            <textarea
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              rows="6"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your notes here..."
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Note Color</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNoteForm({ ...noteForm, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 ${noteForm.color === color.value ? 'border-blue-500' : 'border-transparent'} ${color.class}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setShowNoteModal(false)
              setEditingNote(null)
              setNoteForm({ title: '', content: '', color: '#fef3c7' })
            }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
