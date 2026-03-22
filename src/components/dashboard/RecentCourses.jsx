import { Link } from 'react-router-dom'

export default function RecentCourses({ courses }) {
  if (!courses || courses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Courses</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">You haven't enrolled in any courses yet</p>
          <Link 
            to="/student/browse" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Courses</h2>
        <Link to="/student/my-courses" className="text-blue-600 hover:underline text-sm">
          View All →
        </Link>
      </div>
      
      <div className="space-y-4">
        {courses.map((enrollment) => (
          <Link 
            key={enrollment.id}
            to={`/student/course/${enrollment.courses.id}`}
            className="block border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {enrollment.courses.thumbnail_url ? (
                  <img src={enrollment.courses.thumbnail_url} alt={enrollment.courses.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-2xl">📚</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{enrollment.courses.title}</h3>
                <p className="text-sm text-gray-500">
                  {enrollment.courses.level} • {enrollment.courses.profiles?.full_name || 'Instructor'}
                </p>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{enrollment.progress || 0}%</span>
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
