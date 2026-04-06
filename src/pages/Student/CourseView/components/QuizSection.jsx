import React from 'react'
import { Card, Button } from '../../../../components/ui'
import QuizCard from './QuizCard'
import CountdownTimer from './CountdownTimer'
import { formatLocalTime } from '../utils/timeHelpers'

const QuizSection = ({
  quizzes,
  quizResults,
  currentQuizIndex,
  setCurrentQuizIndex,
  quizTakingState,
  showUpcomingQuizzes,
  setShowUpcomingQuizzes,
  studentTimezone,
  availableQuizzes,
  upcomingQuizzes,
  completedQuizzesCount,
  isQuizAvailable,
  getTimeRemaining,
  getQuizStatusMessage,
  startQuiz,
  resetQuiz,
  handleQuizComplete
}) => {
  const currentQuiz = quizzes[currentQuizIndex]
  const result = currentQuiz ? quizResults[currentQuiz.id] : null
  const isTaking = currentQuiz ? quizTakingState[currentQuiz.id] : false

  const onQuizComplete = (passed, score) => {
    if (currentQuiz) {
      handleQuizComplete(currentQuiz.id, passed, score)
      resetQuiz(currentQuiz.id)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-5 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">📝 Course Quizzes</h2>
          <div className="text-sm text-gray-500">
            Progress: {completedQuizzesCount}/{quizzes.length}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Test your knowledge with these quizzes{studentTimezone && ` • Your timezone: ${studentTimezone}`}
        </p>
      </div>
      
      {/* Upcoming Quizzes Section */}
      {upcomingQuizzes.length > 0 && (
        <div className="border-b px-5 pt-4 pb-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-blue-600">📅 Upcoming Quizzes ({upcomingQuizzes.length})</h3>
            <Button size="sm" variant="outline" onClick={() => setShowUpcomingQuizzes(!showUpcomingQuizzes)}>
              {showUpcomingQuizzes ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showUpcomingQuizzes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingQuizzes.map(quiz => {
                const timeRemaining = getTimeRemaining(quiz)
                return (
                  <div key={quiz.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                    <div className="mb-3">
                      <h4 className="font-semibold text-lg">{quiz.title}</h4>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{quiz.description.substring(0, 100)}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Available: {formatLocalTime(quiz.publish_at)}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <CountdownTimer timeRemaining={timeRemaining} studentTimezone={studentTimezone} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Available Quizzes Section */}
      {availableQuizzes.length > 0 && (
        <>
          {availableQuizzes.length > 1 && (
            <div className="border-b px-5 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableQuizzes.map((quiz) => {
                  const quizResult = quizResults[quiz.id]
                  const isPassed = quizResult?.passed
                  const quizIndex = quizzes.findIndex(q => q.id === quiz.id)
                  return (
                    <button
                      key={quiz.id}
                      onClick={() => setCurrentQuizIndex(quizIndex)}
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition whitespace-nowrap ${
                        currentQuizIndex === quizIndex
                          ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                          : isPassed
                            ? 'text-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {quiz.title}
                      {isPassed && ' ✓'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          <div className="p-5">
            {currentQuiz && (
              <QuizCard
                quiz={currentQuiz}
                result={result}
                isTaking={isTaking}
                studentTimezone={studentTimezone}
                onStart={startQuiz}
                onComplete={onQuizComplete}
                onRetake={() => resetQuiz(currentQuiz.id)}
                isQuizAvailable={isQuizAvailable}
                getQuizStatusMessage={getQuizStatusMessage}
              />
            )}
          </div>
        </>
      )}

      {/* No Quizzes Message */}
      {availableQuizzes.length === 0 && upcomingQuizzes.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold mb-2">No Quizzes Available</h3>
          <p className="text-gray-600">Check back later for quizzes in this course</p>
        </div>
      )}
    </div>
  )
}

export default QuizSection