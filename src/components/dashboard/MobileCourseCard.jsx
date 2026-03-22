import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function MobileCourseCard({ course, progress, isTeacher = false }) {
  const { isMobile } = useTheme()
  const courseData = course.courses || course
  
  if (isMobile) {
    return (
      <Link to={`/${isTeacher ? 'teacher' : 'student'}/course/${courseData.id}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-3 overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {courseData.thumbnail_url ? (
                <img src={courseData.thumbnail_url} alt={courseData.title} className="w-full h-full object-cover rounded-lg" />
              ) : (
                '📚'
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{courseData.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {courseData.level} • {courseData.profiles?.full_name || 'Instructor'}
              </p>
              {progress !== undefined && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className="h-1.5 bg-green-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% Complete</p>
                </div>
              )}
            </div>
            
            {/* Arrow */}
            <div className="text-gray-400">→</div>
          </div>
        </div>
      </Link>
    )
  }
  
  // Desktop version
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-500 relative">
        {courseData.thumbnail_url && (
          <img src={courseData.thumbnail_url} alt={courseData.title} className="w-full h-full object-cover" />
        )}
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
            <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{courseData.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{courseData.level} • {courseData.profiles?.full_name}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-600">{progress}% Complete</span>
          <span className="text-blue-600 text-sm">Continue →</span>
        </div>
      </div>
    </div>
  )
}
