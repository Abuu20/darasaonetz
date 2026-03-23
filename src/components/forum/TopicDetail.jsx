import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Avatar, Spinner, Input } from '../ui'

export default function TopicDetail({ topicId, courseId, onBack }) {
  const { user, profile } = useAuth()
  const [topic, setTopic] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [likes, setLikes] = useState({})

  useEffect(() => {
    fetchTopic()
  }, [topicId])

  async function fetchTopic() {
    try {
      // Increment views
      await supabase.rpc('increment_topic_views', { topic_id: topicId })
      
      // Fetch topic with profile
      const { data: topicData, error: topicError } = await supabase
        .from('forum_topics')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('id', topicId)
        .single()

      if (topicError) throw topicError
      setTopic(topicData)

      // Fetch replies with profiles
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            role
          ),
          likes:forum_likes (count)
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })

      if (repliesError) throw repliesError
      setReplies(repliesData || [])

      // Check user likes
      if (user) {
        const { data: userLikes } = await supabase
          .from('forum_likes')
          .select('reply_id')
          .eq('user_id', user.id)
          .in('reply_id', repliesData?.map(r => r.id) || [])

        const likesMap = {}
        userLikes?.forEach(like => {
          likesMap[like.reply_id] = true
        })
        setLikes(likesMap)
      }

    } catch (error) {
      console.error('Error fetching topic:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateReply(e) {
    e.preventDefault()
    if (!newReply.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('forum_replies')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          content: newReply
        })

      if (error) throw error

      await supabase.rpc('increment_reply_count', { topic_id: topicId })

      setNewReply('')
      fetchTopic()
    } catch (error) {
      console.error('Error creating reply:', error)
      alert('Failed to post reply')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkBestAnswer(replyId) {
    if (!confirm('Mark this as the best answer?')) return

    try {
      const { error } = await supabase
        .from('forum_replies')
        .update({ is_best_answer: true })
        .eq('id', replyId)

      if (error) throw error

      await supabase
        .from('forum_topics')
        .update({ is_solved: true })
        .eq('id', topicId)

      fetchTopic()
    } catch (error) {
      console.error('Error marking best answer:', error)
      alert('Failed to mark best answer')
    }
  }

  async function handleLike(replyId) {
    try {
      const { data: existing } = await supabase
        .from('forum_likes')
        .select('id')
        .eq('reply_id', replyId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('forum_likes')
          .delete()
          .eq('id', existing.id)
        setLikes({ ...likes, [replyId]: false })
      } else {
        await supabase
          .from('forum_likes')
          .insert({
            reply_id: replyId,
            user_id: user.id
          })
        setLikes({ ...likes, [replyId]: true })
      }

      fetchTopic()
    } catch (error) {
      console.error('Error liking reply:', error)
    }
  }

  async function handleDeleteReply(replyId) {
    if (!confirm('Delete this reply?')) return

    try {
      const { error } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyId)

      if (error) throw error

      await supabase.rpc('decrement_reply_count', { topic_id: topicId })
      fetchTopic()
    } catch (error) {
      console.error('Error deleting reply:', error)
      alert('Failed to delete reply')
    }
  }

  async function handleDeleteTopic() {
    if (!confirm('Delete this topic? All replies will be deleted.')) return

    try {
      const { error } = await supabase
        .from('forum_topics')
        .delete()
        .eq('id', topicId)

      if (error) throw error
      onBack()
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert('Failed to delete topic')
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

  if (loading) return <Spinner />

  if (!topic) return <div>Topic not found</div>

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'
  const isOwner = user?.id === topic.user_id

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button onClick={onBack} className="text-blue-600 hover:underline mb-2">
        ← Back to Topics
      </button>

      {/* Topic */}
      <Card>
        <div className="flex items-start gap-3">
          <Avatar
            src={topic.profiles?.avatar_url}
            alt={topic.profiles?.full_name}
            size="md"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-xl font-bold">{topic.title}</h1>
                  {topic.is_pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">📌 Pinned</span>}
                  {topic.is_solved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Solved</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">
                    Posted by {topic.profiles?.full_name}
                  </p>
                  {getUserRoleBadge(topic.profiles?.role)}
                  <span className="text-xs text-gray-400">
                    • {new Date(topic.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {(isOwner || isTeacher) && (
                <Button variant="danger" size="sm" onClick={handleDeleteTopic}>
                  Delete Topic
                </Button>
              )}
            </div>
            <div className="mt-4 prose max-w-none">
              <p>{topic.content}</p>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              👁️ {topic.views || 0} views • 💬 {topic.replies_count || 0} replies
            </div>
          </div>
        </div>
      </Card>

      {/* Replies */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h3>

        {replies.map(reply => (
          <Card key={reply.id} className={reply.is_best_answer ? 'border-2 border-green-500' : ''}>
            <div className="flex items-start gap-3">
              <Avatar
                src={reply.profiles?.avatar_url}
                alt={reply.profiles?.full_name}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{reply.profiles?.full_name}</p>
                      {getUserRoleBadge(reply.profiles?.role)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {reply.is_best_answer && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Best Answer ✓
                      </span>
                    )}
                    {!topic.is_solved && isTeacher && !reply.is_best_answer && (
                      <Button size="sm" onClick={() => handleMarkBestAnswer(reply.id)}>
                        Mark as Best
                      </Button>
                    )}
                    {user?.id === reply.user_id && (
                      <Button size="sm" variant="danger" onClick={() => handleDeleteReply(reply.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 prose max-w-none">
                  <p>{reply.content}</p>
                </div>
                <button
                  onClick={() => handleLike(reply.id)}
                  className="mt-2 text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
                >
                  {likes[reply.id] ? '❤️' : '🤍'} {reply.likes?.[0]?.count || 0} likes
                </button>
              </div>
            </div>
          </Card>
        ))}

        {/* Reply Form */}
        {user && (
          <Card>
            <form onSubmit={handleCreateReply} className="space-y-3">
              <label className="block text-gray-700 dark:text-gray-300 font-medium">
                Your Reply
              </label>
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your reply..."
                required
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Reply'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
