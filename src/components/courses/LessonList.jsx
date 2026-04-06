import { useState } from 'react'

export default function LessonList({ lessons, currentLesson, completedLessons, onSelectLesson }) {
  const [expanded, setExpanded] = useState(null)

  const toggleExpand = (lessonId, e) => {
    e.stopPropagation()
    setExpanded(expanded === lessonId ? null : lessonId)
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {lessons.map((lesson, index) => {
        const isCompleted = completedLessons?.includes(lesson.id)
        const isCurrent = currentLesson?.id === lesson.id
        const isExpanded = expanded === lesson.id
        const hasDescription = lesson.description && lesson.description.trim().length > 0

        return (
          <div key={lesson.id} className="border-b last:border-b-0 border-gray-100 dark:border-gray-700">
            <div
              onClick={() => onSelectLesson(lesson)}
              className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer ${
                isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Lesson Number / Status Icon */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                
                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-medium truncate ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {lesson.title}
                    </h3>
                    {lesson.is_free && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {lesson.duration && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ⏱️ {lesson.duration} min
                      </span>
                    )}
                    {hasDescription && (
                      <button
                        onClick={(e) => toggleExpand(lesson.id, e)}
                        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        {isExpanded ? '▼ Less' : '▶ More'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Current Lesson Indicator */}
                {isCurrent && (
                  <span className="text-xs text-blue-500 flex-shrink-0">Playing</span>
                )}
              </div>
            </div>

            {/* Expanded Description */}
            {isExpanded && hasDescription && (
              <div className="px-4 pb-4 pl-14">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {lesson.description}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}