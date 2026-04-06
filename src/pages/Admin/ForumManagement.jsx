
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Input, Select, Table, Avatar } from '../../components/ui'

export default function ForumManagement() {
  const { showSuccess, showError, showWarning, showInfo } = useTheme()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTopics, setFilteredTopics] = useState([])

  useEffect(() => {
    fetchTopics()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [searchTerm, topics])

  async function fetchTopics() {
    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url,
            role
          ),
          courses (
            id,
            title,
            teacher_id,
            profiles:teacher_id (
              full_name
            )
          ),
          replies:forum_replies (count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTopics(data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterTopics() {
    let filtered = [...topics]

    if (searchTerm) {
      filtered = filtered.filter(topic =>
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTopics(filtered)
  }

  async function handleDeleteTopic(topicId) {
    if (!confirm('Delete this topic? This will also delete all replies.')) return

    try {
      const { error } = await supabase
        .from('forum_topics')
        .delete()
        .eq('id', topicId)

      if (error) throw error
      fetchTopics()
      showSuccess('Topic deleted successfully')
    } catch (error) {
      console.error('Error deleting topic:', error)
      showInfo('Failed to delete topic')
    }
  }

  async function handlePinTopic(topicId, isPinned) {
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_pinned: !isPinned })
        .eq('id', topicId)

      if (error) throw error
      fetchTopics()
    } catch (error) {
      console.error('Error pinning topic:', error)
      showInfo('Failed to pin topic')
    }
  }

  const getRoleBadge = (role) => {
    if (role === 'teacher') {
      return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Teacher</span>
    }
    if (role === 'admin') {
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Admin</span>
    }
    return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Student</span>
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Forum Management</h1>
        <p className="text-red-100">Monitor and manage all discussions across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Total Topics</h3>
          <p className="text-3xl font-bold text-red-600">{topics.length}</p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Total Replies</h3>
          <p className="text-3xl font-bold text-blue-600">
            {topics.reduce((sum, t) => sum + (t.replies?.[0]?.count || 0), 0)}
          </p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Pinned Topics</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {topics.filter(t => t.is_pinned).length}
          </p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Solved Topics</h3>
          <p className="text-3xl font-bold text-green-600">
            {topics.filter(t => t.is_solved).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <Input
          label="Search Topics"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, content, author, or course..."
        />
        <p className="text-sm text-gray-500 mt-2">
          Showing {filteredTopics.length} of {topics.length} topics
        </p>
      </Card>

      {/* Topics Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Header>Topic</Table.Header>
                <Table.Header>Author</Table.Header>
                <Table.Header>Course</Table.Header>
                <Table.Header>Teacher</Table.Header>
                <Table.Header>Replies</Table.Header>
                <Table.Header>Status</Table.Header>
                <Table.Header>Actions</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {filteredTopics.map(topic => (
                <Table.Row key={topic.id}>
                  <Table.Cell>
                    <div>
                      <p className="font-medium">
                        {topic.is_pinned && <span className="text-yellow-500 mr-1">📌</span>}
                        {topic.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">{topic.content}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar src={topic.profiles?.avatar_url} alt={topic.profiles?.full_name} size="sm" />
                      <div>
                        <p className="text-sm">{topic.profiles?.full_name || 'Unknown'}</p>
                        {getRoleBadge(topic.profiles?.role)}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/admin/courses/${topic.course_id}`} className="text-blue-600 hover:underline">
                      {topic.courses?.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    {topic.courses?.profiles?.full_name || 'Unknown'}
                  </Table.Cell>
                  <Table.Cell>{topic.replies?.[0]?.count || 0}</Table.Cell>
                  <Table.Cell>
                    {topic.is_solved ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Solved</span>
                    ) : topic.is_pinned ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pinned</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Open</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
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
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No topics found</p>
          </div>
        )}
      </Card>
    </div>
  )
}
