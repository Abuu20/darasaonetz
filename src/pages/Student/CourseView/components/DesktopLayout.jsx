// src/pages/Student/CourseView/components/DesktopLayout.jsx
import React from 'react'
import LessonList from '../../../../components/courses/LessonList'
import CourseProgress from '../../../../components/courses/CourseProgress'
import LessonContent from './LessonContent'
import QuizSection from './QuizSection'
import NotesSection from './NotesSection'
import ForumSection from './ForumSection'
import ReviewsSection from './ReviewsSection'
import CertificateBanner from './CertificateBanner'

const DesktopLayout = ({
  course,
  lessons,
  currentLesson,
  setCurrentLesson,
  completedLessons,
  totalProgress,
  activeView,
  setActiveView,
  navigationItems,
  // Lesson props
  lessonMaterials,
  onVideoTimeUpdate,
  onBookmark,
  onMarkComplete,
  // Quiz props
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
  handleQuizComplete,
  // Notes props
  refreshBookmarks,
  videoCurrentTime,
  onSeek,
  // Forum props
  selectedTopic,
  setSelectedTopic,
  // Reviews props
  hasReviewed,
  enrollment,
  onReviewSubmitted,
  fetchCourseData,
  // Certificate props
  isComplete,
  certificateIssued,
  user,
  courseId
}) => {
  // Handle lesson selection - THIS IS THE KEY FIX
  const handleSelectLesson = (lesson) => {
    setCurrentLesson(lesson)
    setActiveView('lesson')  // Always switch to lesson view when selecting a lesson
  }

  // Handle navigation item click
  const handleNavigationClick = (viewId) => {
    setActiveView(viewId)
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - Lessons */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col shadow-lg">
        <div className="p-5 border-b flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition"
              title="Back to courses"
            >
              ←
            </button>
            <h2 className="font-bold text-lg truncate flex-1">{course?.title}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">{course?.profiles?.full_name}</p>
          <CourseProgress progress={totalProgress} />
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <LessonList 
            lessons={lessons}
            currentLesson={currentLesson}
            completedLessons={completedLessons}
            onSelectLesson={handleSelectLesson}  // Use the fixed handler
          />
        </div>
        
        <div className="border-t p-3 space-y-1 flex-shrink-0">
          {navigationItems.filter(item => item.id !== 'lesson').map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item.id)}  // Use the fixed handler
              className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center gap-3 ${
                activeView === item.id 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' 
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-xs text-gray-400">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Lesson View */}
          {activeView === 'lesson' && currentLesson && (
            <>
              <LessonContent 
                currentLesson={currentLesson}
                lessonMaterials={lessonMaterials}
                onVideoTimeUpdate={onVideoTimeUpdate}
                onBookmark={onBookmark}
              />
              <div className="mt-4 flex justify-end">
                {!completedLessons.includes(currentLesson?.id) && (
                  <button
                    onClick={() => onMarkComplete(currentLesson.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition"
                  >
                    ✓ Mark Complete
                  </button>
                )}
              </div>
              <CertificateBanner 
                isComplete={isComplete}
                certificateIssued={certificateIssued}
                user={user}
                courseId={courseId}
                course={course}
              />
            </>
          )}

          {/* Notes View */}
          {activeView === 'notes' && (
            <NotesSection 
              courseId={courseId}
              currentLesson={currentLesson}
              refreshBookmarks={refreshBookmarks}
              videoCurrentTime={videoCurrentTime}
              onSeek={onSeek}
            />
          )}

          {/* Quiz View */}
          {activeView === 'quiz' && (
            <QuizSection
              quizzes={quizzes}
              quizResults={quizResults}
              currentQuizIndex={currentQuizIndex}
              setCurrentQuizIndex={setCurrentQuizIndex}
              quizTakingState={quizTakingState}
              showUpcomingQuizzes={showUpcomingQuizzes}
              setShowUpcomingQuizzes={setShowUpcomingQuizzes}
              studentTimezone={studentTimezone}
              availableQuizzes={availableQuizzes}
              upcomingQuizzes={upcomingQuizzes}
              completedQuizzesCount={completedQuizzesCount}
              isQuizAvailable={isQuizAvailable}
              getTimeRemaining={getTimeRemaining}
              getQuizStatusMessage={getQuizStatusMessage}
              startQuiz={startQuiz}
              resetQuiz={resetQuiz}
              handleQuizComplete={handleQuizComplete}
            />
          )}

          {/* Forum View */}
          {activeView === 'forum' && (
            <ForumSection 
              courseId={courseId}
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
            />
          )}

          {/* Reviews View */}
          {activeView === 'reviews' && (
            <ReviewsSection 
              courseId={courseId}
              hasReviewed={hasReviewed}
              enrollment={enrollment}
              onReviewSubmitted={onReviewSubmitted}
              fetchCourseData={fetchCourseData}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default DesktopLayout