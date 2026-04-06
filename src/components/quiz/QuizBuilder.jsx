// src/components/quiz/QuizBuilder.jsx
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { Card, Button, Input, Modal } from '../ui'

export default function QuizBuilder({ courseId, quizId, onQuestionsChange }) {
  const { showSuccess, showError, showInfo } = useTheme()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [quiz, setQuiz] = useState(null)

  useEffect(() => {
    if (quizId) {
      fetchQuizAndQuestions()
    }
  }, [quizId])

  async function fetchQuizAndQuestions() {
    try {
      setLoading(true)
      
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()
      
      if (quizError) throw quizError
      setQuiz(quizData)
      
      // Fetch questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          options:quiz_options (*)
        `)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true })
      
      if (questionsError) throw questionsError
      setQuestions(questionsData || [])
      
      console.log('Fetched questions:', questionsData) // Debug log
      
    } catch (error) {
      console.error('Error fetching quiz:', error)
      showError('Failed to load quiz questions')
    } finally {
      setLoading(false)
    }
  }

  async function saveQuestion() {
    if (!currentQuestion?.question_text?.trim()) {
      showInfo('Please enter a question')
      return
    }

    setSaving(true)

    try {
      console.log('Saving question:', currentQuestion) // Debug log

      // First, save or update the question
      const questionData = {
        quiz_id: quizId,
        question_text: currentQuestion.question_text.trim(),
        question_type: currentQuestion.question_type || 'multiple_choice',
        points: currentQuestion.points || 1,
        order_index: currentQuestion.order_index !== undefined ? currentQuestion.order_index : questions.length
      }

      let questionResult

      if (currentQuestion.id) {
        // Update existing question
        const { data, error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', currentQuestion.id)
          .select()

        if (error) throw error
        questionResult = data
        console.log('Updated question:', questionResult)
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('quiz_questions')
          .insert([questionData])
          .select()

        if (error) throw error
        questionResult = data
        console.log('Created question:', questionResult)
      }

      if (!questionResult || questionResult.length === 0) {
        throw new Error('Failed to save question')
      }

      const savedQuestionId = questionResult[0].id

      // Now save options if it's multiple choice or true/false
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        // Delete existing options for this question
        const { error: deleteError } = await supabase
          .from('quiz_options')
          .delete()
          .eq('question_id', savedQuestionId)

        if (deleteError) {
          console.error('Error deleting old options:', deleteError)
        }

        // Prepare options for insertion
        const optionsToInsert = currentQuestion.options
          .filter(opt => opt.text && opt.text.trim()) // Only insert non-empty options
          .map((opt, idx) => ({
            question_id: savedQuestionId,
            option_text: opt.text.trim(),
            is_correct: opt.is_correct || false,
            order_index: idx
          }))

        if (optionsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('quiz_options')
            .insert(optionsToInsert)

          if (insertError) {
            console.error('Error inserting options:', insertError)
            throw insertError
          }
          console.log('Saved options:', optionsToInsert)
        }
      }

      showSuccess(currentQuestion.id ? 'Question updated!' : 'Question added!')
      setShowQuestionModal(false)
      setCurrentQuestion(null)
      
      // Refresh questions list
      await fetchQuizAndQuestions()
      
      if (onQuestionsChange) {
        onQuestionsChange()
      }

    } catch (error) {
      console.error('Error saving question:', error)
      showError('Failed to save question: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question? This will also delete all answers and cannot be undone.')) return

    try {
      setSaving(true)
      
      // Delete the question (options will be deleted automatically due to cascade)
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      showSuccess('Question deleted')
      await fetchQuizAndQuestions()
      
      if (onQuestionsChange) {
        onQuestionsChange()
      }

    } catch (error) {
      console.error('Error deleting question:', error)
      showError('Failed to delete question')
    } finally {
      setSaving(false)
    }
  }

  function addNewQuestion() {
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    })
    setShowQuestionModal(true)
  }

  function editQuestion(question) {
    setCurrentQuestion({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      points: question.points,
      order_index: question.order_index,
      options: question.options || []
    })
    setShowQuestionModal(true)
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-2">
        Loading questions...
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-sm text-red-500 py-2">
        Quiz not found
      </div>
    )
  }

  return (
    <div className="space-y-3 border-t pt-3 mt-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm text-gray-600">
          Questions ({questions.length})
        </h4>
        <Button size="sm" variant="outline" onClick={addNewQuestion} disabled={saving}>
          + Add Question
        </Button>
      </div>
      
      {questions.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500">
            No questions yet. Click "Add Question" to start building your quiz.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div key={q.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {idx + 1}. {q.question_text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'} • {q.points} point{q.points !== 1 ? 's' : ''}
                  </p>
                  {q.options && q.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id || optIdx} className="text-xs flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${opt.is_correct ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-gray-600 dark:text-gray-400">{opt.option_text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => editQuestion(q)}
                    disabled={saving}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => deleteQuestion(q.id)}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Question Modal */}
      <Modal 
        isOpen={showQuestionModal} 
        onClose={() => {
          setShowQuestionModal(false)
          setCurrentQuestion(null)
        }} 
        title={currentQuestion?.id ? 'Edit Question' : 'Add Question'}
        size="large"
      >
        {currentQuestion && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Question Text *
              </label>
              <textarea
                value={currentQuestion.question_text}
                onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                placeholder="Enter your question"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Question Type
                </label>
                <select
                  value={currentQuestion.question_type}
                  onChange={(e) => {
                    const newType = e.target.value
                    let newOptions = currentQuestion.options
                    
                    // Reset options based on type
                    if (newType === 'true_false') {
                      newOptions = [
                        { text: 'True', is_correct: false },
                        { text: 'False', is_correct: false }
                      ]
                    } else if (newType === 'multiple_choice' && (!currentQuestion.options || currentQuestion.options.length === 0)) {
                      newOptions = [
                        { text: '', is_correct: false },
                        { text: '', is_correct: false },
                        { text: '', is_correct: false },
                        { text: '', is_correct: false }
                      ]
                    }
                    
                    setCurrentQuestion({
                      ...currentQuestion,
                      question_type: newType,
                      options: newOptions
                    })
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Points
                </label>
                <input
                  type="number"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})}
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
            
            {currentQuestion.question_type === 'multiple_choice' && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Answer Options *
                </label>
                <div className="space-y-2">
                  {currentQuestion.options?.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.is_correct}
                        onChange={() => {
                          const newOptions = currentQuestion.options.map((o, i) => ({
                            ...o,
                            is_correct: i === idx
                          }))
                          setCurrentQuestion({...currentQuestion, options: newOptions})
                        }}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options]
                          newOptions[idx].text = e.target.value
                          setCurrentQuestion({...currentQuestion, options: newOptions})
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select the radio button for the correct answer. At least one option must be marked correct.
                </p>
              </div>
            )}
            
            {currentQuestion.question_type === 'true_false' && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                  Correct Answer *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="trueFalse"
                      checked={currentQuestion.options?.[0]?.is_correct === true}
                      onChange={() => {
                        setCurrentQuestion({
                          ...currentQuestion,
                          options: [
                            { text: 'True', is_correct: true },
                            { text: 'False', is_correct: false }
                          ]
                        })
                      }}
                      className="w-4 h-4"
                    />
                    <span>True</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="trueFalse"
                      checked={currentQuestion.options?.[1]?.is_correct === true}
                      onChange={() => {
                        setCurrentQuestion({
                          ...currentQuestion,
                          options: [
                            { text: 'True', is_correct: false },
                            { text: 'False', is_correct: true }
                          ]
                        })
                      }}
                      className="w-4 h-4"
                    />
                    <span>False</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowQuestionModal(false)
                  setCurrentQuestion(null)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveQuestion}
                disabled={saving}
              >
                {saving ? 'Saving...' : (currentQuestion.id ? 'Update Question' : 'Save Question')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}