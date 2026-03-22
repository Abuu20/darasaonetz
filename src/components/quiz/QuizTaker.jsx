import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { quizQueries } from '../../supabase/queries/quiz'
import { Card, Button, Spinner } from '../ui'

export default function QuizTaker({ quizId, onComplete }) {
  const { user } = useAuth()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [timeLeft, setTimeLeft] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [completedAttempts, setCompletedAttempts] = useState([])
  const [canStartNew, setCanStartNew] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [quizStarted, setQuizStarted] = useState(false)

  // Fetch quiz data on mount
  useEffect(() => {
    if (quizId && user) {
      fetchQuizData()
    }
  }, [quizId, user])

  // Auto-submit on tab close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (quizStarted && !submitted && attempt) {
        e.preventDefault()
        e.returnValue = 'You have an ongoing quiz. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [quizStarted, submitted, attempt])

  // Timer for quiz
  useEffect(() => {
    if (quizStarted && quiz?.time_limit && startTime && !submitted && !submitting) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = (quiz.time_limit * 60) - elapsed
        setTimeLeft(Math.max(0, remaining))
        
        if (remaining <= 0 && !submitted) {
          handleAutoSubmit()
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [quizStarted, quiz, startTime, submitted, submitting])

  async function fetchQuizData() {
    try {
      setLoading(true)
      
      // Fetch quiz
      const quizData = await quizQueries.getQuizById(quizId)
      setQuiz(quizData)
      
      // Fetch questions
      const questionsData = await quizQueries.getQuestions(quizId)
      setQuestions(questionsData)
      
      // Fetch attempts
      const attempts = await quizQueries.getStudentAttempts(quizId, user.id)
      const completed = attempts.filter(a => a.completed_at !== null)
      const inProgress = attempts.find(a => a.completed_at === null)
      
      setCompletedAttempts(completed)
      setAttemptCount(completed.length)
      
      // Check if can start new attempt
      const maxAttempts = quizData.attempts_allowed || 1
      setCanStartNew(completed.length < maxAttempts)
      
      // If there's a completed attempt, show results
      if (completed.length > 0) {
        const lastAttempt = completed[0]
        setScore(lastAttempt.score)
        setSubmitted(true)
        setShowResults(true)
        
        // Load answers for the completed attempt
        const answersData = await quizQueries.getAnswersForAttempt(lastAttempt.id)
        const answersMap = {}
        answersData.forEach(answer => {
          answersMap[answer.question_id] = answer.option_id
        })
        setAnswers(answersMap)
      }
      // If there's an in-progress attempt, resume it
      else if (inProgress) {
        setAttempt(inProgress)
        setStartTime(new Date(inProgress.started_at).getTime())
        setQuizStarted(true)
        
        // Load existing answers
        const answersData = await quizQueries.getAnswersForAttempt(inProgress.id)
        const answersMap = {}
        answersData.forEach(answer => {
          answersMap[answer.question_id] = answer.option_id
        })
        setAnswers(answersMap)
      }
      
    } catch (error) {
      console.error('Error fetching quiz data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function startQuiz() {
    const maxAttempts = quiz?.attempts_allowed || 1
    if (completedAttempts.length >= maxAttempts) {
      setError(`You have already used all ${maxAttempts} attempt(s)`)
      return
    }
    
    try {
      const newAttempt = await quizQueries.createAttempt(quizId, user.id)
      setAttempt(newAttempt)
      setStartTime(Date.now())
      setQuizStarted(true)
      setAnswers({})
    } catch (error) {
      console.error('Error starting quiz:', error)
      setError('Failed to start quiz: ' + error.message)
    }
  }

  const handleAutoSubmit = useCallback(async () => {
    if (submitted || submitting || !attempt) return
    
    setSubmitting(true)
    
    try {
      let correctCount = 0
      const answersToSave = []
      
      questions.forEach(question => {
        const selectedOptionId = answers[question.id]
        const selectedOption = question.options?.find(o => o.id === selectedOptionId)
        const isCorrect = selectedOption?.is_correct || false
        
        if (isCorrect) correctCount++
        
        if (selectedOptionId) {
          answersToSave.push({
            attempt_id: attempt.id,
            question_id: question.id,
            option_id: selectedOptionId,
            is_correct: isCorrect
          })
        }
      })
      
      const totalQuestions = questions.length
      const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : null
      
      // Save answers
      await quizQueries.saveAnswers(attempt.id, answersToSave)
      
      // Complete attempt
      await quizQueries.completeAttempt(attempt.id, finalScore, finalScore >= (quiz?.passing_score || 70), timeSpent)
      
      setScore(finalScore)
      setSubmitted(true)
      setShowResults(true)
      
      // Update attempt count
      const newAttemptCount = completedAttempts.length + 1
      const maxAttempts = quiz?.attempts_allowed || 1
      setCanStartNew(newAttemptCount < maxAttempts)
      
      if (onComplete) onComplete(finalScore >= (quiz?.passing_score || 70))
      
    } catch (error) {
      console.error('Error auto-submitting quiz:', error)
      setError('Failed to submit quiz: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }, [questions, answers, attempt, startTime, quiz, completedAttempts.length, onComplete, submitted, submitting])

  async function handleSubmit() {
    if (submitted || submitting) return
    
    // Check if all questions answered
    if (Object.keys(answers).length !== questions.length) {
      setError(`Please answer all questions (${Object.keys(answers).length}/${questions.length} answered)`)
      return
    }
    
    await handleAutoSubmit()
  }

  function toggleResults() {
    setShowResults(!showResults)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center py-8">
          <div className="text-red-500 mb-4">❌</div>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card.Body>
      </Card>
    )
  }

  if (!quiz) {
    return (
      <Card>
        <Card.Body className="text-center py-8">
          <p>No quiz available for this course</p>
        </Card.Body>
      </Card>
    )
  }

  const maxAttempts = quiz.attempts_allowed || 1
  const attemptsUsed = completedAttempts.length
  const attemptsLeft = maxAttempts - attemptsUsed

  // Show completed quiz results
  if (submitted && completedAttempts.length > 0) {
    const passingScore = quiz.passing_score || 70
    const passed = (score || 0) >= passingScore
    
    return (
      <Card>
        <Card.Body className="text-center py-8">
          <div className={`text-6xl mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {passed ? '🎉' : '📝'}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {passed ? 'Quiz Passed!' : 'Quiz Completed'}
          </h3>
          <p className="text-gray-600 mb-4">
            Your score: {score || 0}% (Required: {passingScore}%)
          </p>
          <p className="text-gray-500 text-sm mb-4">
            You have used {attemptsUsed} of {maxAttempts} allowed attempt{maxAttempts !== 1 ? 's' : ''}
          </p>
          {quiz.show_answers && (
            <Button variant="outline" onClick={toggleResults} className="mt-2">
              {showResults ? 'Hide Answers' : 'Review Answers'}
            </Button>
          )}
          
          {showResults && (
            <div className="mt-6 text-left max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {questions.map((question, idx) => {
                  const selectedOptionId = answers[question.id]
                  const selectedOption = question.options?.find(o => o.id === selectedOptionId)
                  const correctOption = question.options?.find(o => o.is_correct)
                  const isCorrect = selectedOption?.is_correct || false
                  
                  return (
                    <div key={question.id} className={`border rounded-lg p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <p className="font-medium mb-3">
                        {idx + 1}. {question.question_text}
                      </p>
                      <div className="space-y-2 ml-4">
                        <p className="text-sm">
                          <span className="font-medium">Your answer:</span>{' '}
                          <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {selectedOption?.option_text || 'Not answered'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-600">
                            <span className="font-medium">Correct answer:</span> {correctOption?.option_text}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    )
  }

  // Show "No attempts left"
  if (!canStartNew && !quizStarted && attemptsUsed >= maxAttempts) {
    return (
      <Card>
        <Card.Body className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-bold mb-2">No More Attempts</h3>
          <p className="text-gray-600 mb-4">
            You have used all {maxAttempts} allowed attempt{maxAttempts !== 1 ? 's' : ''}
          </p>
          <p className="text-gray-500 text-sm">
            Your last score: {completedAttempts[0]?.score || 0}%
          </p>
        </Card.Body>
      </Card>
    )
  }

  // Show start screen
  if (!quizStarted && canStartNew && attemptsLeft > 0) {
    return (
      <Card>
        <Card.Body className="text-center py-8">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold mb-4">{quiz.title}</h3>
          <p className="text-gray-600 mb-6">{quiz.description || 'Test your knowledge with this quiz'}</p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>📊 Questions:</span>
                <span className="font-semibold">{questions.length}</span>
              </p>
              {quiz.time_limit && (
                <p className="flex justify-between">
                  <span>⏱️ Time Limit:</span>
                  <span className="font-semibold">{quiz.time_limit} minutes</span>
                </p>
              )}
              <p className="flex justify-between">
                <span>✅ Passing Score:</span>
                <span className="font-semibold">{quiz.passing_score || 70}%</span>
              </p>
              <p className="flex justify-between">
                <span>🔄 Attempts:</span>
                <span className="font-semibold">{attemptsUsed} / {maxAttempts}</span>
              </p>
              <p className="flex justify-between">
                <span>📝 Attempts Remaining:</span>
                <span className="font-semibold text-green-600">{attemptsLeft}</span>
              </p>
            </div>
          </div>
          
          <Button onClick={startQuiz} size="lg">
            Start Quiz
          </Button>
        </Card.Body>
      </Card>
    )
  }

  // Active quiz taking
  if (quizStarted && attempt && !submitted) {
    return (
      <div className="space-y-4">
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xl font-bold">{quiz.title}</h3>
              {timeLeft !== null && (
                <div className="text-lg font-semibold text-orange-600">
                  Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="flex gap-4 text-sm text-gray-500 mt-2">
              <span>📝 Questions: {questions.length}</span>
              <span>✅ Passing: {quiz.passing_score || 70}%</span>
              <span>🔄 Attempt: {attemptsUsed + 1}/{maxAttempts}</span>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {questions.map((question, idx) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <p className="font-medium mb-3">
                    {idx + 1}. {question.question_text}
                  </p>
                  
                  <div className="space-y-2 ml-4">
                    {question.options?.map(option => (
                      <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.id}
                          checked={answers[question.id] === option.id}
                          onChange={() => setAnswers({
                            ...answers,
                            [question.id]: option.id
                          })}
                          className="w-4 h-4"
                          disabled={submitting}
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option.option_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || Object.keys(answers).length !== questions.length}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
            {Object.keys(answers).length !== questions.length && (
              <p className="text-sm text-orange-500 mt-2 text-center">
                Please answer all questions ({Object.keys(answers).length}/{questions.length} answered)
              </p>
            )}
          </Card.Body>
        </Card>
      </div>
    )
  }

  return <Spinner />
}
