import { useState } from 'react'

export default function LessonList({ lessons, currentLesson, completedLessons, onSelectLesson }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="divide-y">
      {lessons.map((lesson, index) => {
        const isCompleted = completedLessons?.includes(lesson.id)
        const isCurrent = currentLesson?.id === lesson.id
        const isExpanded = expanded === lesson.id

        return (
          <div key={lesson.id} className="border-b last:border-b-0">
            <button
              onClick={() => onSelectLesson(lesson)}
              className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                isCurrent ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {lesson.duration ? `${lesson.duration} min` : 'No duration'}
                  </p>
                </div>
                {lesson.is_free && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Free
                  </span>
                )}
              </div>
            </button>

            {lesson.description && (
              <div className="px-4 pb-4 pl-14">
                <p className="text-sm text-gray-600">{lesson.description}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
