import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Input, Spinner, Tabs } from '../../components/ui'
import VideoUpload from '../../components/ui/VideoUpload'
import QuizBuilder from '../../components/quiz/QuizBuilder'

export default function LessonManager() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [activeTab, setActiveTab] = useState('lessons')
  const [quiz, setQuiz] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    duration: '',
    order_index: 0,
    is_free: false
  })

  useEffect(() => {
    fetchCourseAndLessons()
    fetchQuiz()
  }, [courseId])

  async function fetchCourseAndLessons() {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchQuiz() {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle()
      
      if (error) throw error
      setQuiz(data)
    } catch (error) {
      console.error('Error fetching quiz:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleVideoUpload = (url) => {
    setFormData(prev => ({ ...prev, video_url: url }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      video_url: '',
      duration: '',
      order_index: lessons.length,
      is_free: false
    })
    setEditingLesson(null)
    setShowForm(false)
  }

  const handleEdit = (lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      duration: lesson.duration || '',
      order_index: lesson.order_index,
      is_free: lesson.is_free || false
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            video_url: formData.video_url,
            duration: formData.duration ? parseInt(formData.duration) : null,
            is_free: formData.is_free
          })
          .eq('id', editingLesson.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert({
            course_id: courseId,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            video_url: formData.video_url,
            duration: formData.duration ? parseInt(formData.duration) : null,
            order_index: lessons.length,
            is_free: formData.is_free
          })

        if (error) throw error
      }

      await fetchCourseAndLessons()
      resetForm()

    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error

      await fetchCourseAndLessons()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson')
    }
  }

  const tabs = [
    { id: 'lessons', label: 'Lessons' },
    { id: 'quiz', label: quiz ? 'Course Quiz' : 'Add Quiz' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manage Course Content</h1>
          <p className="text-gray-600">Course: {course?.title}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/teacher')}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <Tabs tabs={tabs} defaultTab="lessons" onChange={setActiveTab}>
          {/* Lessons Tab */}
          <div id="lessons" className="space-y-6">
            {/* Add Lesson Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ Add Lesson'}
              </Button>
            </div>

            {/* Lesson Form */}
            {showForm && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">
                    {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                  </h2>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Lesson Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />

                    <div>
                      <label className="block text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <VideoUpload
                      label="Lesson Video"
                      onUploadComplete={handleVideoUpload}
                      courseId={courseId}
                      existingUrl={formData.video_url}
                    />

                    <div>
                      <label className="block text-gray-700 mb-2">Lesson Content</label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows="8"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        placeholder="Write your lesson content here..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Duration (minutes)"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleInputChange}
                        min="0"
                      />

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="is_free"
                            checked={formData.is_free}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span>Free Preview Lesson</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Add Lesson'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card.Body>
              </Card>
            )}

            {/* Lessons List */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Lessons ({lessons.length})</h2>
              </Card.Header>
              <Card.Body>
                {lessons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">No lessons added yet</p>
                    <Button onClick={() => setShowForm(true)}>
                      Add Your First Lesson
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">#{index + 1}</span>
                              <h3 className="font-semibold">{lesson.title}</h3>
                              {lesson.is_free && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                            )}
                            
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              {lesson.duration && <span>⏱️ {lesson.duration} min</span>}
                              {lesson.video_url && <span>🎥 Has Video</span>}
                              <span>📝 Has Content: {lesson.content ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(lesson.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Quiz Tab */}
          <div id="quiz">
            <QuizBuilder 
              courseId={courseId} 
              lessonId={null}
              onSaved={fetchQuiz}
            />
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
