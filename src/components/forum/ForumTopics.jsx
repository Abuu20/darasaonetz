// src/components/forum/ForumTopics.jsx
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Avatar, Spinner, Input } from '../ui'

export default function ForumTopics({ courseId, onSelectTopic }) {
  const { showSuccess, showError, showWarning, showInfo } = useTheme()
  const { user, profile } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTopics()
  }, [courseId])

  async function fetchTopics() {
    try {
      const { data, error } = await supabase
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

      if (error) throw error
      console.log('Fetched topics:', data) // Debug log
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
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
          content: newTopic.content,
          views: 0,
          replies_count: 0
        })

      if (error) throw error

      setNewTopic({ title: '', content: '' })
      setShowCreateForm(false)
      fetchTopics()
      showSuccess('Topic created successfully!')
    } catch (error) {
      console.error('Error creating topic:', error)
      showInfo('Failed to create topic')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to get user role badge
  const getUserRoleBadge = (role) => {
    if (role === 'teacher') {
      return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded ml-2">Teacher</span>
    }
    if (role === 'admin') {
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded ml-2">Admin</span>
    }
    return null
  }

  // Format view count for display
  const formatViewCount = (views) => {
    if (!views) return '0 views'
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k views`
    }
    return `${views} view${views !== 1 ? 's' : ''}`
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Discussion Forum</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
          {showCreateForm ? 'Cancel' : '+ New Topic'}
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
              placeholder="What's your question?"
              required
            />
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={newTopic.content}
                onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                rows="4"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide details about your question..."
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Post Topic'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Topics List */}
      {topics.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-gray-500">No topics yet</p>
            <p className="text-sm text-gray-400">Be the first to start a discussion!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {topics.map(topic => (
            <div 
              key={topic.id} 
              onClick={() => onSelectTopic && onSelectTopic(topic.id)} 
              className="cursor-pointer"
            >
              <Card hover>
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">
                        By {topic.profiles?.full_name?.split(' ')[0] || 'User'}
                      </span>
                      {getUserRoleBadge(topic.profiles?.role)}
                      <span className="text-xs text-gray-400">
                        • {new Date(topic.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {topic.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>💬 {topic.replies?.[0]?.count || 0} replies</span>
                      {/* View count display - NOW SHOWING REAL COUNTS */}
                      <span className="flex items-center gap-1" title={`${topic.views || 0} total views`}>
                        👁️ {formatViewCount(topic.views || 0)}
                      </span>
                    </div>
                  </div>
                  {topic.replies?.[0]?.count > 0 && (
                    <div className="text-right text-sm text-blue-600">
                      {topic.replies[0].count} replies
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}