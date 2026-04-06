import React from 'react'
import { Card, Button } from '../../../../components/ui'
import QuizTaker from '../../../../components/quiz/QuizTaker'
import CountdownTimer from './CountdownTimer'
import { formatLocalTime } from '../utils/timeHelpers'

const QuizCard = ({ 
  quiz, 
  result, 
  isTaking, 
  studentTimezone, 
  onStart, 
  onComplete, 
  onRetake,
  isQuizAvailable,
  getQuizStatusMessage,
  formatLocalTime: formatTime
}) => {
  const isPassed = result?.passed
  const isAvailable = isQuizAvailable(quiz)
  const statusMessage = getQuizStatusMessage(quiz)
  const timeRemaining = quiz.timeRemaining
  const isScheduled = quiz.publish_at && new Date(quiz.publish_at) > new Date()
  const attemptsAllowed = quiz.max_attempts || 1
  const attemptsUsed = result?.completedAt ? 1 : 0
  const canRetake = !isPassed && attemptsUsed < attemptsAllowed

  if (!isAvailable && isScheduled) {
    return (
      <Card>
        <Card.Body className="text-center py-6">
          <div className="text-5xl mb-3">⏰</div>
          <h3 className="text-base font-bold mb-2">Quiz Scheduled</h3>
          <p className="text-xs text-gray-600 mb-2">
            Available from:<br />
            <span className="font-semibold text-sm">{formatLocalTime(quiz.publish_at)}</span>
          </p>
          <div className="mt-3">
            <CountdownTimer timeRemaining={timeRemaining} studentTimezone={studentTimezone} />
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (!isAvailable) {
    return (
      <Card>
        <Card.Body className="text-center py-6">
          <div className="text-5xl mb-3">🔒</div>
          <h3 className="text-base font-bold mb-2">Quiz Not Available</h3>
          <p className="text-xs text-gray-600">{statusMessage || 'This quiz is currently not available'}</p>
        </Card.Body>
      </Card>
    )
  }

  if (isPassed) {
    return (
      <Card>
        <Card.Body className="text-center py-6">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-base font-bold mb-2">Quiz Passed!</h3>
          <p className="text-xs text-gray-600 mb-2">
            Score: {result.score}% (Required: {quiz.passing_score || 70}%)
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Completed: {formatLocalTime(result.completedAt)}
          </p>
          {canRetake && (
            <Button onClick={onRetake} size="sm" className="mt-2">
              Retake Quiz
            </Button>
          )}
        </Card.Body>
      </Card>
    )
  }

  if (isTaking) {
    return (
      <QuizTaker 
        key={quiz.id}
        quizId={quiz.id} 
        onComplete={onComplete}
      />
    )
  }

  return (
    <Card>
      <Card.Body className="py-4">
        <div className="text-center mb-3">
          <div className="text-4xl mb-2">📝</div>
          <h3 className="text-lg font-bold mb-1">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-xs text-gray-600">{quiz.description}</p>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Questions:</span>
              <span className="font-semibold">To be loaded</span>
            </div>
            {quiz.time_limit && (
              <div className="flex justify-between">
                <span>Time Limit:</span>
                <span className="font-semibold">{quiz.time_limit} min</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Passing Score:</span>
              <span className="font-semibold">{quiz.passing_score || 70}%</span>
            </div>
            <div className="flex justify-between">
              <span>Attempts:</span>
              <span className="font-semibold">{attemptsUsed}/{attemptsAllowed}</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Button onClick={() => onStart(quiz.id)} size="sm">
            Start Quiz
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default QuizCard