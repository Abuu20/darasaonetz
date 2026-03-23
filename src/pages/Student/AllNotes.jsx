import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Spinner, Input } from '../../components/ui'

export default function AllNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredNotes, setFilteredNotes] = useState([])

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    filterNotes()
  }, [searchTerm, notes])

  async function fetchNotes() {
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          *,
          courses (
            id,
            title
          ),
          lessons (
            id,
            title
          )
        `)
        .eq('student_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterNotes() {
    let filtered = [...notes]
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredNotes(filtered)
  }

  const colors = {
    '#fef3c7': 'bg-yellow-50',
    '#e0f2fe': 'bg-blue-50',
    '#dcfce7': 'bg-green-50',
    '#ffe4e6': 'bg-pink-50',
    '#f1f5f9': 'bg-gray-50',
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">My Notes</h1>
        <p className="text-blue-100">All your notes across all courses</p>
      </div>

      <Card>
        <Input
          label="Search Notes"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title or content..."
        />
        <p className="text-sm text-gray-500 mt-2">
          {filteredNotes.length} notes found
        </p>
      </Card>

      {filteredNotes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-gray-500">No notes found</p>
            <p className="text-sm text-gray-400 mt-2">
              Start taking notes while learning
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <div key={note.id} className={`${colors[note.color] || 'bg-gray-50'} rounded-lg p-4 border`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {note.is_pinned && <span className="text-yellow-500 text-sm">📌 Pinned</span>}
                  <h3 className="font-semibold text-lg mt-1">{note.title}</h3>
                  <Link to={`/student/course/${note.course_id}`} className="text-sm text-blue-600 hover:underline">
                    {note.courses?.title}
                  </Link>
                  {note.lessons && (
                    <p className="text-xs text-gray-500 mt-1">
                      Lesson: {note.lessons?.title}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Updated: {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Link to={`/student/course/${note.course_id}`}>
                  <Button size="sm" variant="outline">View Course</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
