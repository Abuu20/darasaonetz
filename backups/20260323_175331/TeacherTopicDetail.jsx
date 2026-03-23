import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Avatar, Spinner } from '../../components/ui'

export default function TeacherTopicDetail() {
  const { courseId, topicId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [topic, setTopic] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTopic()
  }, [topicId])

  async function fetchTopic() {
    try {
      // Check if user has permission
      const { data: course } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single()

      if (course.teacher_id !== user.id && profile?.role !== 'admin') {
        alert('You do not have permission')
        navigate('/teacher')
        return
      }

      // Fetch topic
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

      // Fetch replies
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
    try {
      await supabase
        .from('forum_replies')
        .update({ is_best_answer: true })
        .eq('id', replyId)

      await supabase
        .from('forum_topics')
        .update({ is_solved: true })
        .eq('id', topicId)

      fetchTopic()
    } catch (error) {
      console.error('Error marking best answer:', error)
    }
  }

  async function handleDeleteReply(replyId) {
    if (!confirm('Delete this reply?')) return

    try {
      await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyId)

      await supabase.rpc('decrement_reply_count', { topic_id: topicId })
      fetchTopic()
    } catch (error) {
      console.error('Error deleting reply:', error)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <Link to={`/teacher/forum/${courseId}`} className="text-blue-600 hover:underline">
        ← Back to Forum
      </Link>

      <Card>
        <div className="flex items-start gap-3">
          <Avatar src={topic?.profiles?.avatar_url} alt={topic?.profiles?.full_name} size="md" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{topic?.title}</h1>
            <p className="text-sm text-gray-500">
              Posted by {topic?.profiles?.full_name} • {new Date(topic?.created_at).toLocaleDateString()}
            </p>
            <div className="mt-4 prose max-w-none">
              <p>{topic?.content}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">{replies.length} Replies</h3>

        {replies.map(reply => (
          <Card key={reply.id} className={reply.is_best_answer ? 'border-2 border-green-500' : ''}>
            <div className="flex items-start gap-3">
              <Avatar src={reply.profiles?.avatar_url} alt={reply.profiles?.full_name} size="sm" />
              <div className="flex-1">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-medium">{reply.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {reply.is_best_answer && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Best Answer</span>
                    )}
                    {!topic?.is_solved && (
                      <Button size="sm" onClick={() => handleMarkBestAnswer(reply.id)}>
                        Mark as Best
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDeleteReply(reply.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="mt-2 prose max-w-none">
                  <p>{reply.content}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Card>
          <form onSubmit={handleCreateReply} className="space-y-3">
            <label className="block text-gray-700 dark:text-gray-300 font-medium">Your Reply</label>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Write your reply..."
              required
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Reply'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
