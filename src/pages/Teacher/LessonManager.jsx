// src/pages/Teacher/LessonManager.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Input, Spinner, Tabs, Modal } from '../../components/ui'
import VideoUpload from '../../components/ui/VideoUpload'
import CloudinaryUpload from '../../components/ui/CloudinaryUpload'
import RichTextEditor from '../../components/ui/RichTextEditor'
import MaterialGalleryManager from '../../components/courses/MaterialGalleryManager'
import QuizBuilder from '../../components/quiz/QuizBuilder'
import QuizResults from '../../components/quiz/QuizResults'
import CoursePreview from '../../components/courses/CoursePreview'
import { useTheme } from '../../context/ThemeContext'

export default function LessonManager() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [activeTab, setActiveTab] = useState('lessons')
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [showVideoHelp, setShowVideoHelp] = useState(false)
  const [showMaterialManager, setShowMaterialManager] = useState(false)
  const [selectedLessonForMaterials, setSelectedLessonForMaterials] = useState(null)
  const [draggedLesson, setDraggedLesson] = useState(null)
  const [dragOverLesson, setDragOverLesson] = useState(null)
  const [draggedQuiz, setDraggedQuiz] = useState(null)
  const [dragOverQuiz, setDragOverQuiz] = useState(null)
  const [materialSource, setMaterialSource] = useState('url')
  const [lessonMaterials, setLessonMaterials] = useState([])
  const [expandedQuizzes, setExpandedQuizzes] = useState({})
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [livePreview, setLivePreview] = useState(false)
  
  // Timezone state
  const [teacherTimezone, setTeacherTimezone] = useState('Africa/Nairobi')
  const [availableTimezones, setAvailableTimezones] = useState([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    duration: '',
    order_index: 0,
    is_free: false
  })
  const [quizFormData, setQuizFormData] = useState({
    title: '',
    description: '',
    time_limit: 30,
    passing_score: 70,
    max_attempts: 1,
    show_answers: true,
    order_index: 0,
    status: 'draft',
    publish_at: '',
    unpublish_at: '',
    randomize_questions: false
  })
  
  // Course settings form state
  const [courseSettings, setCourseSettings] = useState({
    title: '',
    description: '',
    price: '',
    level: '',
    category_id: '',
    thumbnail_url: '',
    status: 'draft'
  })
  const [categories, setCategories] = useState([])
  const [savingCourse, setSavingCourse] = useState(false)
  const [showCourseSettings, setShowCourseSettings] = useState(false)

  // Helper function to format UTC time to local datetime-local input value
  const formatUTCToLocalDateTime = (utcString) => {
    if (!utcString) return ''
    const date = new Date(utcString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Helper function to convert local datetime to UTC for storage
  const convertLocalToUTC = (localDateTimeString) => {
    if (!localDateTimeString) return null
    const localDate = new Date(localDateTimeString)
    return localDate.toISOString()
  }

  // Helper function to display time in user's local timezone
  const displayLocalTime = (utcString) => {
    if (!utcString) return 'Not set'
    const date = new Date(utcString)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  // Toggle quiz expansion
  const toggleQuizExpand = (quizId) => {
    setExpandedQuizzes(prev => ({
      ...prev,
      [quizId]: !prev[quizId]
    }))
  }

  // Expand all quizzes
  const expandAllQuizzes = () => {
    const allExpanded = {}
    quizzes.forEach(quiz => {
      allExpanded[quiz.id] = true
    })
    setExpandedQuizzes(allExpanded)
    showSuccess('All quizzes expanded')
  }

  // Collapse all quizzes
  const collapseAllQuizzes = () => {
    setExpandedQuizzes({})
    showSuccess('All quizzes collapsed')
  }

  // Handle quiz results click - navigate to results tab
  const handleViewResults = (quiz) => {
    setSelectedQuiz(quiz)
    setActiveTab('results')
  }

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTeacherTimezone(detectedTimezone)
    
    const timezones = [
      'Africa/Nairobi', 'Africa/Dar_es_Salaam', 'Africa/Kampala', 'Africa/Addis_Ababa',
      'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata',
      'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
    ]
    setAvailableTimezones(timezones)
    
    fetchCourseAndLessons()
    fetchQuizzes()
    fetchCategories()
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
      
      setCourseSettings({
        title: courseData.title || '',
        description: courseData.description || '',
        price: courseData.price || '',
        level: courseData.level || '',
        category_id: courseData.category_id || '',
        thumbnail_url: courseData.thumbnail_url || '',
        status: courseData.status || 'draft'
      })

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      showError('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchQuizzes() {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setQuizzes(data || [])
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function fetchLessonMaterials(lessonId) {
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
  }

  async function updateCourseSettings() {
    if (!courseSettings.title.trim()) {
      showError('Please enter a course title')
      return
    }

    setSavingCourse(true)
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          title: courseSettings.title,
          description: courseSettings.description,
          price: courseSettings.price ? parseFloat(courseSettings.price) : null,
          level: courseSettings.level,
          category_id: courseSettings.category_id || null,
          thumbnail_url: courseSettings.thumbnail_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)

      if (error) throw error
      
      showSuccess('Course settings updated successfully!')
      await fetchCourseAndLessons()
      setShowCourseSettings(false)
      
    } catch (error) {
      console.error('Error updating course:', error)
      showError('Failed to update course settings')
    } finally {
      setSavingCourse(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    // Auto-update live preview
    setLivePreview(true)
  }

  const handleContentChange = (content) => {
    setFormData({ ...formData, content })
    setLivePreview(true)
  }

  const handleQuizInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setQuizFormData({
      ...quizFormData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleCourseSettingsChange = (e) => {
    const { name, value } = e.target
    setCourseSettings({
      ...courseSettings,
      [name]: value
    })
  }

  const handleVideoUrlSave = (url) => {
    setFormData(prev => ({ ...prev, video_url: url }))
    showSuccess('Video URL saved')
    setLivePreview(true)
  }

  const handleMaterialUpload = (url) => {
    setFormData(prev => ({ ...prev, video_url: url }))
    showSuccess('Material uploaded successfully')
    setLivePreview(true)
  }

  const handleThumbnailUpload = (url) => {
    setCourseSettings(prev => ({ ...prev, thumbnail_url: url }))
    showSuccess('Thumbnail uploaded successfully')
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
    setMaterialSource('url')
    setLivePreview(false)
  }

  const resetQuizForm = () => {
    setQuizFormData({
      title: '',
      description: '',
      time_limit: 30,
      passing_score: 70,
      max_attempts: 1,
      show_answers: true,
      order_index: quizzes.length,
      status: 'draft',
      publish_at: '',
      unpublish_at: '',
      randomize_questions: false
    })
    setEditingQuiz(null)
    setShowQuizModal(false)
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
    if (lesson.video_url?.includes('cloudinary.com')) {
      setMaterialSource('upload')
    } else {
      setMaterialSource('url')
    }
    setShowForm(true)
    setLivePreview(true)
  }

  const handleManageMaterials = async (lesson) => {
    setSelectedLessonForMaterials(lesson)
    await fetchLessonMaterials(lesson.id)
    setShowMaterialManager(true)
  }

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz)
    setQuizFormData({
      title: quiz.title,
      description: quiz.description || '',
      time_limit: quiz.time_limit || 30,
      passing_score: quiz.passing_score || 70,
      max_attempts: quiz.max_attempts || 1,
      show_answers: quiz.show_answers !== false,
      order_index: quiz.order_index,
      status: quiz.status || 'draft',
      publish_at: formatUTCToLocalDateTime(quiz.publish_at),
      unpublish_at: formatUTCToLocalDateTime(quiz.unpublish_at),
      randomize_questions: quiz.randomize_questions || false
    })
    setShowQuizModal(true)
  }

  const handleSubmitLesson = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      showError('Please enter a lesson title')
      return
    }

    setSaving(true)

    try {
      const lessonData = {
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        content: formData.content,
        video_url: formData.video_url || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        order_index: editingLesson ? formData.order_index : lessons.length,
        is_free: formData.is_free
      }

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)

        if (error) throw error
        showSuccess('Lesson updated successfully!')
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData])

        if (error) throw error
        showSuccess('Lesson added successfully!')
      }

      await fetchCourseAndLessons()
      resetForm()

    } catch (error) {
      console.error('Error saving lesson:', error)
      showError('Failed to save lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitQuiz = async (e) => {
    e.preventDefault()
    if (!quizFormData.title.trim()) {
      showError('Please enter a quiz title')
      return
    }

    setSaving(true)

    try {
      const publishAtUTC = convertLocalToUTC(quizFormData.publish_at)
      const unpublishAtUTC = convertLocalToUTC(quizFormData.unpublish_at)
      
      const quizData = {
        course_id: courseId,
        title: quizFormData.title,
        description: quizFormData.description,
        time_limit: quizFormData.time_limit,
        passing_score: quizFormData.passing_score,
        max_attempts: quizFormData.max_attempts,
        show_answers: quizFormData.show_answers,
        order_index: editingQuiz ? quizFormData.order_index : quizzes.length,
        status: quizFormData.status,
        publish_at: publishAtUTC,
        unpublish_at: unpublishAtUTC,
        randomize_questions: quizFormData.randomize_questions,
        timezone: teacherTimezone
      }

      if (editingQuiz) {
        const { error } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id)

        if (error) throw error
        showSuccess('Quiz updated successfully!')
      } else {
        const { error } = await supabase
          .from('quizzes')
          .insert([quizData])

        if (error) throw error
        showSuccess('Quiz added successfully!')
      }

      await fetchQuizzes()
      resetQuizForm()

    } catch (error) {
      console.error('Error saving quiz:', error)
      showError('Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  const handlePublishQuiz = async (quizId) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ status: 'published' })
        .eq('id', quizId)

      if (error) throw error
      showSuccess('Quiz published successfully!')
      await fetchQuizzes()
    } catch (error) {
      console.error('Error publishing quiz:', error)
      showError('Failed to publish quiz')
    }
  }

  const handleUnpublishQuiz = async (quizId) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ status: 'draft' })
        .eq('id', quizId)

      if (error) throw error
      showSuccess('Quiz unpublished successfully')
      await fetchQuizzes()
    } catch (error) {
      console.error('Error unpublishing quiz:', error)
      showError('Failed to unpublish quiz')
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Delete this lesson? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error
      await fetchCourseAndLessons()
      showSuccess('Lesson deleted successfully')
    } catch (error) {
      console.error('Error deleting lesson:', error)
      showError('Failed to delete lesson')
    }
  }

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz? All questions and answers will be permanently deleted.')) return

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) throw error
      await fetchQuizzes()
      showSuccess('Quiz deleted successfully')
    } catch (error) {
      console.error('Error deleting quiz:', error)
      showError('Failed to delete quiz')
    }
  }

  const handleMoveLesson = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    
    const newLessons = [...lessons]
    const [movedLesson] = newLessons.splice(fromIndex, 1)
    newLessons.splice(toIndex, 0, movedLesson)
    
    const updatedLessons = newLessons.map((lesson, idx) => ({
      ...lesson,
      order_index: idx
    }))
    
    setLessons(updatedLessons)
    
    try {
      for (const lesson of updatedLessons) {
        await supabase
          .from('lessons')
          .update({ order_index: lesson.order_index })
          .eq('id', lesson.id)
      }
      showSuccess('Lesson order updated')
    } catch (error) {
      console.error('Error updating order:', error)
      showError('Failed to update order')
      await fetchCourseAndLessons()
    }
  }

  const handleMoveQuiz = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    
    const newQuizzes = [...quizzes]
    const [movedQuiz] = newQuizzes.splice(fromIndex, 1)
    newQuizzes.splice(toIndex, 0, movedQuiz)
    
    const updatedQuizzes = newQuizzes.map((quiz, idx) => ({
      ...quiz,
      order_index: idx
    }))
    
    setQuizzes(updatedQuizzes)
    
    try {
      for (const quiz of updatedQuizzes) {
        await supabase
          .from('quizzes')
          .update({ order_index: quiz.order_index })
          .eq('id', quiz.id)
      }
      showSuccess('Quiz order updated')
    } catch (error) {
      console.error('Error updating quiz order:', error)
      showError('Failed to update order')
      await fetchQuizzes()
    }
  }

  const handleDragStartLesson = (e, index) => {
    setDraggedLesson(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverLesson = (e, index) => {
    e.preventDefault()
    setDragOverLesson(index)
  }

  const handleDropLesson = (e, dropIndex) => {
    e.preventDefault()
    if (draggedLesson !== null && draggedLesson !== dropIndex) {
      handleMoveLesson(draggedLesson, dropIndex)
    }
    setDraggedLesson(null)
    setDragOverLesson(null)
  }

  const handleDragStartQuiz = (e, index) => {
    setDraggedQuiz(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverQuiz = (e, index) => {
    e.preventDefault()
    setDragOverQuiz(index)
  }

  const handleDropQuiz = (e, dropIndex) => {
    e.preventDefault()
    if (draggedQuiz !== null && draggedQuiz !== dropIndex) {
      handleMoveQuiz(draggedQuiz, dropIndex)
    }
    setDraggedQuiz(null)
    setDragOverQuiz(null)
  }

  const getQuizStatusBadge = (quiz) => {
    const now = new Date()
    const publishAt = quiz.publish_at ? new Date(quiz.publish_at) : null
    const unpublishAt = quiz.unpublish_at ? new Date(quiz.unpublish_at) : null

    if (quiz.status === 'archived') {
      return { text: 'Archived', className: 'bg-gray-100 text-gray-700' }
    }
    
    if (publishAt && now < publishAt) {
      return { text: `Scheduled: ${displayLocalTime(quiz.publish_at)}`, className: 'bg-yellow-100 text-yellow-700' }
    }
    
    if (unpublishAt && now >= unpublishAt) {
      return { text: 'Expired', className: 'bg-gray-100 text-gray-700' }
    }
    
    if (quiz.status === 'published') {
      return { text: 'Published', className: 'bg-green-100 text-green-700' }
    }
    
    return { text: 'Draft', className: 'bg-orange-100 text-orange-700' }
  }

  // Render live preview component
  const renderLivePreview = () => {
    if (!livePreview && !formData.title && !formData.content && !formData.video_url) return null
    
    return (
      <div className="mt-6 border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Real-time</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <div className="max-w-2xl mx-auto">
            {/* Lesson Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {formData.video_url && (
                <div className="aspect-video bg-black">
                  {formData.video_url.includes('youtube.com') || formData.video_url.includes('vimeo.com') ? (
                    <iframe
                      src={formData.video_url.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      title="Preview"
                    />
                  ) : formData.video_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={formData.video_url} alt={formData.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                      📹 Video Preview
                    </div>
                  )}
                </div>
              )}
              <div className="p-5">
                <h4 className="text-xl font-bold mb-2">{formData.title || 'Lesson Title Preview'}</h4>
                {formData.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{formData.description}</p>
                )}
                {formData.content && (
                  <div 
                    className="prose max-w-none dark:prose-invert mt-4 pt-4 border-t"
                    dangerouslySetInnerHTML={{ __html: formData.content.length > 500 ? formData.content.substring(0, 500) + '...' : formData.content }}
                  />
                )}
                {formData.is_free && (
                  <div className="mt-4 inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    🔓 Free Preview Lesson
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            This is how students will see this lesson. Updates in real-time as you type.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'lessons', label: '📚 Lessons' },
    { id: 'quizzes', label: `📝 Quizzes (${quizzes.length})` },
    { id: 'results', label: '📊 Quiz Results' },
    { id: 'settings', label: '⚙️ Course Settings' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Manage Course Content</h1>
          <p className="text-gray-600 dark:text-gray-400">Course: {course?.title}</p>
          <p className="text-xs text-gray-500 mt-1">Your timezone: {teacherTimezone}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreviewModal(true)}>
            👁️ Preview as Student
          </Button>
          <Button variant="outline" onClick={() => navigate('/teacher')}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Card>
        <Tabs tabs={tabs} defaultTab="lessons" onChange={setActiveTab}>
          {/* Lessons Tab */}
          <div id="lessons" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                <span className="ml-2 text-xs text-gray-400">(Drag ⋮⋮ to reorder)</span>
              </div>
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : '+ Add Lesson'}
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-300">📹 Content Upload Guide</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Videos: Use YouTube/Vimeo URLs • Images & PDFs: Upload directly
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowVideoHelp(true)}>
                  View Guide
                </Button>
              </div>
            </div>

            {showForm && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">
                    {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                  </h2>
                  <p className="text-sm text-gray-500">Live preview updates as you type</p>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={handleSubmitLesson} className="space-y-5">
                    <Input
                      label="Lesson Title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Introduction to Quran"
                      required
                    />

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Short Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Brief description of this lesson (shown in lesson list)..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Lesson Material
                      </label>
                      <div className="flex gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => setMaterialSource('url')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            materialSource === 'url'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          🎥 Video (YouTube/Vimeo URL)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMaterialSource('upload')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            materialSource === 'upload'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          📁 Images & PDFs (Upload)
                        </button>
                      </div>

                      {materialSource === 'url' ? (
                        <VideoUpload
                          label="Video URL"
                          onUploadComplete={handleVideoUrlSave}
                          existingUrl={formData.video_url}
                        />
                      ) : (
                        <div className="space-y-3">
                          <CloudinaryUpload
                            label="Upload Image or PDF"
                            onUploadComplete={handleMaterialUpload}
                            folder={`course-materials/${courseId}`}
                            existingUrl={formData.video_url}
                            accept="image/*,application/pdf"
                          />
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                              📌 This section is for images and PDF documents only.
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              For videos, use the "Video URL" tab above with YouTube or Vimeo.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Lesson Content <span className="text-sm text-gray-500">(Rich Text)</span>
                      </label>
                      <RichTextEditor
                        value={formData.content}
                        onChange={handleContentChange}
                        placeholder="Write your lesson content here. You can add headings, lists, images, and more..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use the toolbar to format your text. Add images, lists, headings, and more to make your lesson engaging.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Duration (minutes)"
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="Estimated time"
                      />

                      <div className="flex items-center">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="is_free"
                            checked={formData.is_free}
                            onChange={handleInputChange}
                            className="mr-2 w-4 h-4"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Free Preview Lesson</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Add Lesson'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                  
                  {/* Live Preview Section */}
                  {renderLivePreview()}
                </Card.Body>
              </Card>
            )}

            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Lesson List ({lessons.length})</h2>
                <p className="text-sm text-gray-500">Drag the ⋮⋮ icon to reorder lessons</p>
              </Card.Header>
              <Card.Body>
                {lessons.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-5xl mb-4">📖</p>
                    <p className="mb-2">No lessons added yet</p>
                    <p className="text-sm">Click "Add Lesson" to start building your course</p>
                    <Button 
                      variant="primary" 
                      className="mt-4"
                      onClick={() => setShowForm(true)}
                    >
                      Create Your First Lesson
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => handleDragStartLesson(e, index)}
                        onDragOver={(e) => handleDragOverLesson(e, index)}
                        onDrop={(e) => handleDropLesson(e, index)}
                        className={`border rounded-lg p-4 hover:shadow-md transition cursor-move ${
                          dragOverLesson === index ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 text-sm cursor-grab">⋮⋮</span>
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <h3 className="font-semibold">{lesson.title}</h3>
                              {lesson.is_free && (
                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            
                            {lesson.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">
                                {lesson.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 mt-2 ml-7 text-xs text-gray-500">
                              {lesson.duration && <span>⏱️ {lesson.duration} min</span>}
                              {lesson.video_url && (
                                <span>
                                  {lesson.video_url.includes('youtube.com') ? '▶️ YouTube Video' : 
                                   lesson.video_url.includes('vimeo.com') ? '🎬 Vimeo Video' : 
                                   lesson.video_url.includes('cloudinary.com') ? 
                                     (lesson.video_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? '🖼️ Image' : '📄 PDF Document') :
                                   '🔗 External Link'}
                                </span>
                              )}
                              <span>📝 Content: {lesson.content ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleManageMaterials(lesson)}
                            >
                              📎 Materials
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
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

          {/* Quizzes Tab with Collapsible Quizzes */}
          <div id="quizzes" className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="text-sm text-gray-500">
                {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
                <span className="ml-2 text-xs text-gray-400">(Drag ⋮⋮ to reorder)</span>
              </div>
              <div className="flex gap-2">
                {quizzes.length > 1 && (
                  <>
                    <Button size="sm" variant="outline" onClick={expandAllQuizzes}>
                      📂 Expand All
                    </Button>
                    <Button size="sm" variant="outline" onClick={collapseAllQuizzes}>
                      📁 Collapse All
                    </Button>
                  </>
                )}
                <Button onClick={() => {
                  resetQuizForm()
                  setShowQuizModal(true)
                }}>
                  + Add Quiz
                </Button>
              </div>
            </div>

            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Course Quizzes ({quizzes.length})</h2>
                <p className="text-sm text-gray-500">Click on a quiz to expand/collapse and manage questions</p>
                <p className="text-xs text-gray-400">Times shown in your local timezone: {teacherTimezone}</p>
              </Card.Header>
              <Card.Body>
                {quizzes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-5xl mb-4">📝</p>
                    <p className="mb-2">No quizzes added yet</p>
                    <p className="text-sm">Click "Add Quiz" to create assessments for your students</p>
                    <Button 
                      variant="primary" 
                      className="mt-4"
                      onClick={() => {
                        resetQuizForm()
                        setShowQuizModal(true)
                      }}
                    >
                      Create Your First Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz, index) => {
                      const statusBadge = getQuizStatusBadge(quiz)
                      const isExpanded = expandedQuizzes[quiz.id]
                      
                      return (
                        <div key={quiz.id} className="border rounded-lg overflow-hidden">
                          {/* Quiz Header - Click to expand/collapse */}
                          <div
                            className={`p-4 cursor-pointer transition-colors ${
                              isExpanded ? 'bg-blue-50 dark:bg-blue-900/20 border-b' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => toggleQuizExpand(quiz.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-gray-400 text-sm cursor-grab">⋮⋮</span>
                                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                  <h3 className="font-semibold text-lg">{quiz.title}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                                    {statusBadge.text}
                                  </span>
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    {quiz.time_limit} min
                                  </span>
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    Passing: {quiz.passing_score}%
                                  </span>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Attempts: {quiz.max_attempts || 1}
                                  </span>
                                  {isExpanded ? (
                                    <span className="text-xs text-blue-600">▲ Click to collapse</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">▼ Click to expand</span>
                                  )}
                                </div>
                                
                                {quiz.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-7">
                                    {quiz.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-4 mt-2 ml-7 text-xs text-gray-500">
                                  <span>📝 {quiz.max_attempts || 1} attempt(s) allowed</span>
                                  <span>✓ {quiz.show_answers ? 'Show answers after completion' : 'Hide answers'}</span>
                                  {quiz.randomize_questions && <span>🎲 Randomize questions</span>}
                                  {quiz.publish_at && (
                                    <span>📅 Publish: {displayLocalTime(quiz.publish_at)}</span>
                                  )}
                                  {quiz.unpublish_at && (
                                    <span>⏰ Unpublish: {displayLocalTime(quiz.unpublish_at)}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                {quiz.status !== 'archived' && (
                                  <>
                                    {quiz.status === 'published' ? (
                                      <Button 
                                        size="sm" 
                                        variant="warning" 
                                        onClick={() => handleUnpublishQuiz(quiz.id)}
                                      >
                                        Unpublish
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="success" 
                                        onClick={() => handlePublishQuiz(quiz.id)}
                                      >
                                        Publish
                                      </Button>
                                    )}
                                  </>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewResults(quiz)}
                                >
                                  📊 Results
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditQuiz(quiz)}>
                                  Edit
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteQuiz(quiz.id)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quiz Expanded Content */}
                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-gray-800">
                              <QuizBuilder 
                                courseId={courseId} 
                                quizId={quiz.id}
                                onQuestionsChange={() => {
                                  fetchQuizzes()
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Quiz Results Tab */}
          <div id="results" className="space-y-6">
            {selectedQuiz ? (
              <Card>
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold">Quiz Results: {selectedQuiz.title}</h2>
                      <p className="text-sm text-gray-500">View student performance</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedQuiz(null)}>
                        Back to Quizzes
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <QuizResults courseId={courseId} quizId={selectedQuiz.id} />
                </Card.Body>
              </Card>
            ) : (
              <Card>
                <Card.Body className="text-center py-12">
                  <p className="text-4xl mb-4">📊</p>
                  <p className="text-gray-500 mb-4">Select a quiz to view results</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quizzes.map(quiz => (
                      <Button 
                        key={quiz.id}
                        variant="outline" 
                        onClick={() => setSelectedQuiz(quiz)}
                      >
                        {quiz.title}
                      </Button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Course Settings Tab */}
          <div id="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Settings</h2>
              {!showCourseSettings && (
                <Button onClick={() => setShowCourseSettings(true)}>
                  Edit Course Details
                </Button>
              )}
            </div>

            {!showCourseSettings && course && (
              <Card>
                <Card.Body className="space-y-4">
                  {course.thumbnail_url && (
                    <div className="mb-4">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title} 
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Course Title</p>
                      <p className="font-medium">{course.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{course.price ? `$${course.price}` : 'Free'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Level</p>
                      <p className="font-medium capitalize">{course.level || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className={`font-medium capitalize ${course.status === 'published' ? 'text-green-600' : 'text-orange-600'}`}>
                        {course.status || 'Draft'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-700 dark:text-gray-300">{course.description || 'No description provided'}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {showCourseSettings && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Edit Course Details</h2>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={(e) => { e.preventDefault(); updateCourseSettings(); }} className="space-y-5">
                    <Input
                      label="Course Title"
                      name="title"
                      value={courseSettings.title}
                      onChange={handleCourseSettingsChange}
                      placeholder="Enter course title"
                      required
                    />

                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                        Course Description
                      </label>
                      <textarea
                        name="description"
                        value={courseSettings.description}
                        onChange={handleCourseSettingsChange}
                        rows="4"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Describe what students will learn in this course..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Price ($)"
                        name="price"
                        type="number"
                        value={courseSettings.price}
                        onChange={handleCourseSettingsChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                          Course Level
                        </label>
                        <select
                          name="level"
                          value={courseSettings.level}
                          onChange={handleCourseSettingsChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                        >
                          <option value="">Select Level</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="all">All Levels</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                          Category
                        </label>
                        <select
                          name="category_id"
                          value={courseSettings.category_id}
                          onChange={handleCourseSettingsChange}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                          Course Thumbnail
                        </label>
                        <CloudinaryUpload
                          label="Upload Thumbnail Image"
                          onUploadComplete={handleThumbnailUpload}
                          folder={`course-thumbnails/${courseId}`}
                          existingUrl={courseSettings.thumbnail_url}
                          accept="image/*"
                        />
                        {courseSettings.thumbnail_url && (
                          <div className="mt-2">
                            <img 
                              src={courseSettings.thumbnail_url} 
                              alt="Preview" 
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={savingCourse}>
                        {savingCourse ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCourseSettings(false)
                          if (course) {
                            setCourseSettings({
                              title: course.title || '',
                              description: course.description || '',
                              price: course.price || '',
                              level: course.level || '',
                              category_id: course.category_id || '',
                              thumbnail_url: course.thumbnail_url || '',
                              status: course.status || 'draft'
                            })
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card.Body>
              </Card>
            )}

            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Course Status</h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Course Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={course?.status === 'draft'}
                        onChange={async () => {
                          const { error } = await supabase
                            .from('courses')
                            .update({ status: 'draft' })
                            .eq('id', courseId)
                          if (!error) {
                            await fetchCourseAndLessons()
                            showSuccess('Course saved as draft')
                          }
                        }}
                        className="mr-2"
                      />
                      <span>Draft (only you can see)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="published"
                        checked={course?.status === 'published'}
                        onChange={async () => {
                          if (lessons.length === 0) {
                            showError('Please add at least one lesson before publishing')
                            return
                          }
                          const { error } = await supabase
                            .from('courses')
                            .update({ status: 'published' })
                            .eq('id', courseId)
                          if (!error) {
                            await fetchCourseAndLessons()
                            showSuccess('Course published! Students can now enroll.')
                          }
                        }}
                        className="mr-2"
                      />
                      <span>Published (visible to students)</span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {lessons.length === 0 && course?.status !== 'published' 
                      ? 'You need at least one lesson before publishing this course.' 
                      : ''}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-red-600 mb-3">Danger Zone</h3>
                  <Button 
                    variant="danger" 
                    onClick={async () => {
                      if (confirm('Delete this entire course? All lessons, quizzes, and data will be permanently deleted. This action cannot be undone.')) {
                        try {
                          const { error } = await supabase
                            .from('courses')
                            .delete()
                            .eq('id', courseId)
                          
                          if (error) throw error
                          
                          showSuccess('Course deleted successfully')
                          navigate('/teacher')
                        } catch (error) {
                          console.error('Error deleting course:', error)
                          showError('Failed to delete course')
                        }
                      }
                    }}
                  >
                    Delete Entire Course
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Tabs>
      </Card>

      {/* Quiz Modal */}
      <Modal isOpen={showQuizModal} onClose={() => setShowQuizModal(false)} title={editingQuiz ? 'Edit Quiz' : 'Add New Quiz'} size="large">
        <form onSubmit={handleSubmitQuiz} className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
          <Input
            label="Quiz Title"
            name="title"
            value={quizFormData.title}
            onChange={handleQuizInputChange}
            placeholder="e.g., Chapter 1 Quiz"
            required
          />

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Description
            </label>
            <textarea
              name="description"
              value={quizFormData.description}
              onChange={handleQuizInputChange}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
              placeholder="Describe what this quiz covers..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Time Limit (minutes)"
              name="time_limit"
              type="number"
              value={quizFormData.time_limit}
              onChange={handleQuizInputChange}
              min="1"
              placeholder="30"
            />

            <Input
              label="Passing Score (%)"
              name="passing_score"
              type="number"
              value={quizFormData.passing_score}
              onChange={handleQuizInputChange}
              min="0"
              max="100"
              placeholder="70"
            />

            <Input
              label="Max Attempts Allowed"
              name="max_attempts"
              type="number"
              value={quizFormData.max_attempts}
              onChange={handleQuizInputChange}
              min="1"
              placeholder="1"
            />

            <div className="flex items-center mt-8">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="randomize_questions"
                  checked={quizFormData.randomize_questions}
                  onChange={handleQuizInputChange}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Randomize question order</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Publish Date/Time ({teacherTimezone})
              </label>
              <input
                type="datetime-local"
                name="publish_at"
                value={quizFormData.publish_at}
                onChange={handleQuizInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
              />
              {quizFormData.publish_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Will be available at your local time: {quizFormData.publish_at}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Leave empty to make available immediately when published</p>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Unpublish Date/Time ({teacherTimezone})
              </label>
              <input
                type="datetime-local"
                name="unpublish_at"
                value={quizFormData.unpublish_at}
                onChange={handleQuizInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
              />
              {quizFormData.unpublish_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Will expire at your local time: {quizFormData.unpublish_at}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">Quiz will automatically become unavailable after this time</p>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Quiz Status
            </label>
            <select
              name="status"
              value={quizFormData.status}
              onChange={handleQuizInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="draft">Draft (Not visible to students)</option>
              <option value="published">Published (Visible to students based on schedule)</option>
              <option value="archived">Archived (Hidden, can be restored)</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="show_answers"
                checked={quizFormData.show_answers}
                onChange={handleQuizInputChange}
                className="mr-2 w-4 h-4"
              />
              <span className="text-gray-700 dark:text-gray-300">Show correct answers after completion</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
            </Button>
            <Button type="button" variant="outline" onClick={resetQuizForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Material Manager Modal */}
      <Modal 
        isOpen={showMaterialManager} 
        onClose={() => {
          setShowMaterialManager(false)
          setSelectedLessonForMaterials(null)
          setLessonMaterials([])
        }} 
        title={`Manage Materials: ${selectedLessonForMaterials?.title}`}
        size="large"
      >
        <MaterialGalleryManager
          lessonId={selectedLessonForMaterials?.id}
          courseId={courseId}
          materials={lessonMaterials}
          onMaterialsChange={() => {
            if (selectedLessonForMaterials?.id) {
              fetchLessonMaterials(selectedLessonForMaterials.id)
            }
          }}
        />
      </Modal>

      {/* Course Preview Modal */}
      <Modal 
        isOpen={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)} 
        title="Course Preview (Student View)"
        size="full"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <CoursePreview courseId={courseId} isTeacher={true} />
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button onClick={() => setShowPreviewModal(false)}>Close Preview</Button>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={showVideoHelp} onClose={() => setShowVideoHelp(false)} title="Content Upload Guide">
        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="font-semibold text-lg mb-2">🎥 Videos</h3>
            <p className="text-sm text-gray-600 mb-2">For video content, use external platforms:</p>
            <ul className="text-sm space-y-2 list-disc list-inside text-gray-600">
              <li><strong>YouTube:</strong> Upload video, set to "Unlisted", copy URL</li>
              <li><strong>Vimeo:</strong> Upload video, set privacy to "Hide from Vimeo.com"</li>
              <li><strong>Direct URL:</strong> Use a direct MP4 link if you have hosting</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">📁 Images & PDFs</h3>
            <p className="text-sm text-gray-600 mb-2">Upload directly to Darasaone:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li>Images: JPG, PNG, GIF, WebP (Max 10MB)</li>
              <li>Documents: PDF (Max 10MB)</li>
              <li>Files are stored on Cloudinary CDN</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">📝 Rich Text Editor</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li><strong>Formatting:</strong> Bold, Italic, Underline, Strikethrough</li>
              <li><strong>Headings:</strong> H1, H2, H3 for structure</li>
              <li><strong>Lists:</strong> Bullet points and numbered lists</li>
              <li><strong>Links:</strong> Add clickable links to external resources</li>
              <li><strong>Images:</strong> Embed images directly into your lesson</li>
              <li><strong>Code blocks:</strong> Perfect for programming lessons</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">📎 Multiple Materials</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li>Upload multiple PDFs, images, and files per lesson</li>
              <li>Drag and drop to reorder materials</li>
              <li>Students can view materials in a gallery format</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">📋 Quiz Management</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li><strong>Collapsible Quizzes:</strong> Click on any quiz header to expand/collapse</li>
              <li><strong>Expand All:</strong> Use the "Expand All" button to open all quizzes</li>
              <li><strong>Collapse All:</strong> Use the "Collapse All" button to close all quizzes</li>
              <li><strong>Drag & Drop:</strong> Reorder quizzes by dragging the ⋮⋮ icon</li>
              <li><strong>Schedule:</strong> Set publish/unpublish dates for automatic availability</li>
              <li><strong>Results:</strong> Click "Results" to view student performance for each quiz</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">👁️ Live Preview & Reordering</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li><strong>Live Preview:</strong> See lesson changes in real-time as you type</li>
              <li><strong>Drag & Drop Lessons:</strong> Reorder lessons by dragging the ⋮⋮ icon</li>
              <li><strong>Drag & Drop Quizzes:</strong> Reorder quizzes by dragging the ⋮⋮ icon</li>
              <li><strong>Preview as Student:</strong> See exactly what students will see</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">⏰ Timezone Support</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li>All quiz times are stored in UTC</li>
              <li>You see times in your local timezone: {teacherTimezone}</li>
              <li>Students will see times in their own timezone</li>
              <li>No need to worry about timezone conversions!</li>
            </ul>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowVideoHelp(false)}>Got it!</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}