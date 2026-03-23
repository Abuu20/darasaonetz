import { useState } from 'react'
import { Button } from '../ui'

export default function TeacherReviewResponse({ review, onResponded }) {
  const [showForm, setShowForm] = useState(false)
  const [response, setResponse] = useState(review.teacher_response || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const { supabase } = await import('../../supabase/client')
      
      const { error } = await supabase
        .from('course_reviews')
        .update({
          teacher_response: response,
          teacher_response_at: new Date().toISOString()
        })
        .eq('id', review.id)
      
      if (error) throw error
      
      if (onResponded) onResponded()
      setShowForm(false)
      
    } catch (error) {
      console.error('Error responding to review:', error)
      alert('Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  if (review.teacher_response) {
    return (
      <div className="mt-3 ml-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
          Your Response:
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {review.teacher_response}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-blue-600 hover:underline mt-2"
        >
          Edit Response
        </button>
      </div>
    )
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        Respond to this review
      </button>
    )
  }

  return (
    <div className="mt-3 ml-4">
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows="3"
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write your response to this student..."
        disabled={submitting}
      />
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Response'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
