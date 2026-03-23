import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { Card, Button, Input, Modal } from '../ui'

export default function QuizBuilder({ courseId, lessonId, onSaved }) {
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [quizSettings, setQuizSettings] = useState({
    title: '',
    description: '',
    time_limit: null,
    passing_score: 70,
    attempts_allowed: 1,
    show_answers: true
  })

  useEffect(() => {
    fetchQuiz()
  }, [courseId, lessonId])

  async function fetchQuiz() {
    try {
      // Fetch quiz
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
      
      if (lessonId) {
        query = query.eq('lesson_id', lessonId)
      } else {
        query = query.is('lesson_id', null)
      }
      
      const { data: quizData } = await query.single()
      
      if (quizData) {
        setQuiz(quizData)
        setQuizSettings({
          title: quizData.title,
          description: quizData.description || '',
          time_limit: quizData.time_limit,
          passing_score: quizData.passing_score,
          attempts_allowed: quizData.attempts_allowed,
          show_answers: quizData.show_answers
        })
        
        // Fetch questions
        const { data: questionsData } = await supabase
          .from('quiz_questions')
          .select(`
            *,
            options:quiz_options (*)
          `)
          .eq('quiz_id', quizData.id)
          .order('order_index')
        
        setQuestions(questionsData || [])
      }
    } catch (error) {
      console.error('Error fetching quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createOrUpdateQuiz() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const quizData = {
        course_id: courseId,
        lesson_id: lessonId || null,
        title: quizSettings.title,
        description: quizSettings.description,
        time_limit: quizSettings.time_limit ? parseInt(quizSettings.time_limit) : null,
        passing_score: quizSettings.passing_score,
        attempts_allowed: quizSettings.attempts_allowed,
        show_answers: quizSettings.show_answers
      }
      
      let result
      if (quiz) {
        result = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quiz.id)
      } else {
        result = await supabase
          .from('quizzes')
          .insert([quizData])
          .select()
      }
      
      if (result.error) throw result.error
      
      if (!quiz && result.data) {
        setQuiz(result.data[0])
      }
      
      if (onSaved) onSaved()
      setEditing(false)
      fetchQuiz()
    } catch (error) {
      console.error('Error saving quiz:', error)
      alert('Failed to save quiz')
    }
  }

  async function saveQuestion() {
    if (!currentQuestion?.question_text) return
    
    try {
      const questionData = {
        quiz_id: quiz.id,
        question_text: currentQuestion.question_text,
        question_type: currentQuestion.question_type || 'multiple_choice',
        points: currentQuestion.points || 1,
        order_index: currentQuestion.order_index || questions.length
      }
      
      let questionResult
      if (currentQuestion.id) {
        questionResult = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', currentQuestion.id)
      } else {
        questionResult = await supabase
          .from('quiz_questions')
          .insert([questionData])
          .select()
      }
      
      if (questionResult.error) throw questionResult.error
      
      const questionId = currentQuestion.id || questionResult.data[0].id
      
      // Save options
      if (currentQuestion.options) {
        // Delete existing options
        await supabase
          .from('quiz_options')
          .delete()
          .eq('question_id', questionId)
        
        // Insert new options
        const optionsToInsert = currentQuestion.options.map((opt, idx) => ({
          question_id: questionId,
          option_text: opt.text,
          is_correct: opt.is_correct,
          order_index: idx
        }))
        
        const { error } = await supabase
          .from('quiz_options')
          .insert(optionsToInsert)
        
        if (error) throw error
      }
      
      setShowQuestionModal(false)
      setCurrentQuestion(null)
      fetchQuiz()
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Failed to save question')
    }
  }

  function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
      supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId)
        .then(() => fetchQuiz())
    }
  }

  if (loading) return <div>Loading...</div>

  if (!quiz && !editing) {
    return (
      <Card>
        <Card.Body className="text-center py-8">
          <p className="text-gray-500 mb-4">No quiz created for this lesson yet</p>
          <Button onClick={() => setEditing(true)}>Create Quiz</Button>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {editing || !quiz ? (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">Quiz Settings</h3>
          </Card.Header>
          <Card.Body className="space-y-4">
            <Input
              label="Quiz Title"
              value={quizSettings.title}
              onChange={(e) => setQuizSettings({...quizSettings, title: e.target.value})}
              placeholder="Enter quiz title"
              required
            />
            
            <div>
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                value={quizSettings.description}
                onChange={(e) => setQuizSettings({...quizSettings, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional description..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Time Limit (minutes)"
                type="number"
                value={quizSettings.time_limit || ''}
                onChange={(e) => setQuizSettings({...quizSettings, time_limit: e.target.value || null})}
                placeholder="No limit"
              />
              
              <Input
                label="Passing Score (%)"
                type="number"
                value={quizSettings.passing_score}
                onChange={(e) => setQuizSettings({...quizSettings, passing_score: parseInt(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Attempts Allowed"
                type="number"
                value={quizSettings.attempts_allowed}
                onChange={(e) => setQuizSettings({...quizSettings, attempts_allowed: parseInt(e.target.value)})}
                min="1"
              />
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={quizSettings.show_answers}
                  onChange={(e) => setQuizSettings({...quizSettings, show_answers: e.target.checked})}
                />
                <span>Show correct answers after quiz</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={createOrUpdateQuiz}>
                {quiz ? 'Update Quiz' : 'Create Quiz'}
              </Button>
              {quiz && (
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Quiz Header */}
          <Card>
            <Card.Header className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{quiz.title}</h3>
                <p className="text-sm text-gray-500">{quiz.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit Settings
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>⏱️ {quiz.time_limit ? `${quiz.time_limit} min` : 'No time limit'}</div>
                <div>✅ Passing: {quiz.passing_score}%</div>
                <div>📝 Attempts: {quiz.attempts_allowed}</div>
              </div>
            </Card.Body>
          </Card>
          
          {/* Questions List */}
          <Card>
            <Card.Header className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
              <Button size="sm" onClick={() => {
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
              }}>
                + Add Question
              </Button>
            </Card.Header>
            <Card.Body>
              {questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No questions yet. Add your first question!</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">
                            {idx + 1}. {q.question_text}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'} • {q.points} point{q.points !== 1 ? 's' : ''}
                          </p>
                          {q.options && (
                            <div className="mt-2 space-y-1">
                              {q.options.map(opt => (
                                <div key={opt.id} className="text-sm flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded-full ${opt.is_correct ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  <span>{opt.option_text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setCurrentQuestion(q)
                            setShowQuestionModal(true)
                          }}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => deleteQuestion(q.id)}>
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
        </>
      )}
      
      {/* Question Modal */}
      <Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Add Question">
        {currentQuestion && (
          <div className="space-y-4">
            <Input
              label="Question Text"
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
              placeholder="Enter your question"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <select
                value={currentQuestion.question_type}
                onChange={(e) => setCurrentQuestion({...currentQuestion, question_type: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
              </select>
              
              <Input
                label="Points"
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            
            {currentQuestion.question_type === 'multiple_choice' && (
              <div>
                <label className="block text-gray-700 mb-2">Answer Options</label>
                <div className="space-y-2">
                  {currentQuestion.options?.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="radio"
                        checked={opt.is_correct}
                        onChange={() => {
                          const newOptions = currentQuestion.options.map((o, i) => ({
                            ...o,
                            is_correct: i === idx
                          }))
                          setCurrentQuestion({...currentQuestion, options: newOptions})
                        }}
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options]
                          newOptions[idx].text = e.target.value
                          setCurrentQuestion({...currentQuestion, options: newOptions})
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentQuestion.question_type === 'true_false' && (
              <div>
                <label className="block text-gray-700 mb-2">Correct Answer</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={currentQuestion.options?.[0]?.is_correct}
                      onChange={() => {
                        setCurrentQuestion({
                          ...currentQuestion,
                          options: [
                            { text: 'True', is_correct: true },
                            { text: 'False', is_correct: false }
                          ]
                        })
                      }}
                    />
                    <span>True</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={currentQuestion.options?.[1]?.is_correct}
                      onChange={() => {
                        setCurrentQuestion({
                          ...currentQuestion,
                          options: [
                            { text: 'True', is_correct: false },
                            { text: 'False', is_correct: true }
                          ]
                        })
                      }}
                    />
                    <span>False</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowQuestionModal(false)}>Cancel</Button>
              <Button onClick={saveQuestion}>Save Question</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
