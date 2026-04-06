import { Link } from 'react-router-dom'
import { Card } from '../ui'

export default function RecentCourses({ courses }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Courses</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="mb-4">You haven't enrolled in any courses yet</p>
          <Link 
            to="/student/browse" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Courses</h2>
        <Link to="/student/my-courses" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          View All →
        </Link>
      </div>
      
      <div className="space-y-4">
        {courses.map((enrollment) => (
          <Link 
            key={enrollment.id}
            to={`/student/course/${enrollment.courses.id}`}
            className="block border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                {enrollment.courses.thumbnail_url ? (
                  <img src={enrollment.courses.thumbnail_url} alt={enrollment.courses.title} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  '📚'
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{enrollment.courses.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {enrollment.courses.level} • {enrollment.courses.profiles?.full_name?.split(' ')[0] || 'Instructor'}
                </p>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{enrollment.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
