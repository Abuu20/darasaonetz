import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase/client'
import ForumTopics from '../components/forum/ForumTopics'
import TopicDetail from '../components/forum/TopicDetail'
import { Card, Spinner } from '../components/ui'

export default function ForumPage() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const topicId = searchParams.get('topic')
  
  const [selectedTopic, setSelectedTopic] = useState(topicId)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  async function fetchCourse() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

      if (error) throw error
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discussion Forum</h1>
        <p className="text-gray-500">Ask questions and discuss {course?.title}</p>
      </div>

      {selectedTopic ? (
        <TopicDetail
          topicId={selectedTopic}
          courseId={courseId}
          onBack={() => setSelectedTopic(null)}
        />
      ) : (
        <ForumTopics courseId={courseId} />
      )}
    </div>
  )
}
