// src/pages/Student/CourseView/components/MobileLayout.jsx
import React, { useState } from 'react'
import LessonList from '../../../../components/courses/LessonList'
import CourseProgress from '../../../../components/courses/CourseProgress'
import LessonContent from './LessonContent'
import QuizSection from './QuizSection'
import NotesSection from './NotesSection'
import ForumSection from './ForumSection'
import ReviewsSection from './ReviewsSection'
import CertificateBanner from './CertificateBanner'

const MobileLayout = ({
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
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const currentLessonIndex = lessons.findIndex(l => l.id === currentLesson?.id)

  // Handle lesson selection - THIS IS THE KEY FIX
  const handleSelectLesson = (lesson) => {
    setCurrentLesson(lesson)
    setActiveView('lesson')  // Always switch to lesson view when selecting a lesson
    setShowMobileMenu(false)  // Close the mobile menu after selection
  }

  // Handle navigation item click
  const handleNavigationClick = (viewId) => {
    setActiveView(viewId)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                ←
              </button>
              <h1 className="font-semibold text-sm truncate flex-1 text-center">{course?.title}</h1>
              <button 
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                ☰
              </button>
            </div>
            <CourseProgress progress={totalProgress} size="sm" />
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">Course Content</h3>
                  <button onClick={() => setShowMobileMenu(false)} className="p-1">✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {course?.profiles?.avatar_url ? (
                      <img src={course.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-blue-600">📚</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{course?.title}</p>
                    <p className="text-xs text-gray-500">{course?.profiles?.full_name}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <LessonList 
                  lessons={lessons}
                  currentLesson={currentLesson}
                  completedLessons={completedLessons}
                  onSelectLesson={handleSelectLesson}  // Use the fixed handler
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4">
          {/* Lesson View */}
          {activeView === 'lesson' && currentLesson && (
            <div className="space-y-4">
              <LessonContent 
                currentLesson={currentLesson}
                lessonMaterials={lessonMaterials}
                onVideoTimeUpdate={onVideoTimeUpdate}
                onBookmark={onBookmark}
              />
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mt-1">
                      Lesson {currentLessonIndex + 1} of {lessons.length}
                      {currentLesson?.duration && ` • ${currentLesson.duration} min`}
                    </p>
                  </div>
                  {!completedLessons.includes(currentLesson?.id) && (
                    <button
                      onClick={() => onMarkComplete(currentLesson.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium"
                    >
                      ✓ Complete
                    </button>
                  )}
                </div>
              </div>

              <CertificateBanner 
                isComplete={isComplete}
                certificateIssued={certificateIssued}
                user={user}
                courseId={courseId}
                course={course}
              />
            </div>
          )}

          {/* Notes View */}
          {activeView === 'notes' && (
            <NotesSection 
              courseId={courseId}
              currentLesson={currentLesson}
              refreshBookmarks={refreshBookmarks}
              videoCurrentTime={videoCurrentTime}
              onSeek={onSeek}
              isMobile={true}
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
              isMobile={true}
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
              isMobile={true}
            />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-lg z-20">
          <div className="flex justify-around">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigationClick(item.id)}  // Use the fixed handler
                className={`flex-1 py-3 text-center transition-colors ${
                  activeView === item.id 
                    ? 'text-blue-600 border-t-2 border-blue-600 -mt-px' 
                    : 'text-gray-500'
                }`}
              >
                <div className="text-xl">{item.icon}</div>
                <span className="text-xs mt-1 block">{item.label}</span>
                {item.badge && (
                  <span className="text-xs text-gray-400">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .lesson-content {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }
        .dark .lesson-content {
          color: #e5e7eb;
        }
        .lesson-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .lesson-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }
        .lesson-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .lesson-content p {
          margin-bottom: 0.75rem;
        }
        .lesson-content ul, .lesson-content ol {
          margin-left: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .lesson-content li {
          margin-bottom: 0.25rem;
        }
        .lesson-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .lesson-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.75rem 0;
        }
        .lesson-content pre {
          background-color: #1f2937;
          padding: 0.75rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
          font-size: 0.75rem;
        }
        .lesson-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.75rem;
          color: #dc2626;
        }
      `}</style>
    </>
  )
}

export default MobileLayout