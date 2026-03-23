import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Avatar, Spinner, Input } from '../../components/ui'

export default function TeacherForum() {
  const { courseId } = useParams()
  const { user, profile } = useAuth()
  const [topics, setTopics] = useState([])
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [courseId])

  async function fetchData() {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('title, teacher_id')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      // Check if user is the teacher of this course
      if (courseData.teacher_id !== user.id && profile?.role !== 'admin') {
        alert('You do not have permission to view this forum')
        return
      }

      // Fetch topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role
          ),
          replies:forum_replies (count)
        `)
        .eq('course_id', courseId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (topicsError) throw topicsError
      setTopics(topicsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTopic(e) {
    e.preventDefault()
    if (!newTopic.title.trim() || !newTopic.content.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('forum_topics')
        .insert({
          course_id: courseId,
          user_id: user.id,
          title: newTopic.title,
          content: newTopic.content
        })

      if (error) throw error

      setNewTopic({ title: '', content: '' })
      setShowCreateForm(false)
      fetchData()
    } catch (error) {
      console.error('Error creating topic:', error)
      alert('Failed to create topic')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePinTopic(topicId, isPinned) {
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_pinned: !isPinned })
        .eq('id', topicId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error pinning topic:', error)
      alert('Failed to pin topic')
    }
  }

  async function handleDeleteTopic(topicId) {
    if (!confirm('Delete this topic? All replies will be deleted.')) return

    try {
      const { error } = await supabase
        .from('forum_topics')
        .delete()
        .eq('id', topicId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert('Failed to delete topic')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Course Forum</h1>
        <p className="text-purple-100">Manage discussions for {course?.title}</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">All Topics</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create Announcement'}
        </Button>
      </div>

      {/* Create Topic Form */}
      {showCreateForm && (
        <Card>
          <form onSubmit={handleCreateTopic} className="space-y-3">
            <Input
              label="Topic Title"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              placeholder="Announcement title"
              required
            />
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Content</label>
              <textarea
                value={newTopic.content}
                onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                rows="4"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Write your announcement..."
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Post Announcement'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Topics List with Teacher Controls */}
      {topics.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-gray-500">No topics yet</p>
            <p className="text-sm text-gray-400">Create an announcement to start the discussion</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map(topic => (
            <Card key={topic.id}>
              <div className="flex items-start gap-3">
                <Avatar
                  src={topic.profiles?.avatar_url}
                  alt={topic.profiles?.full_name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">
                      {topic.is_pinned && <span className="text-yellow-500 mr-1">📌</span>}
                      {topic.title}
                    </h3>
                    {topic.is_solved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Solved</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {topic.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>By {topic.profiles?.full_name?.split(' ')[0] || 'User'}</span>
                    <span>📅 {new Date(topic.created_at).toLocaleDateString()}</span>
                    <span>💬 {topic.replies?.[0]?.count || 0} replies</span>
                    <span>👁️ {topic.views || 0} views</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/teacher/forum/${courseId}/topic/${topic.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handlePinTopic(topic.id, topic.is_pinned)}
                  >
                    {topic.is_pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleDeleteTopic(topic.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
