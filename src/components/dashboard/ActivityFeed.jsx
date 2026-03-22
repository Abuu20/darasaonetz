export default function ActivityFeed({ activities }) {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'enrollment': return '📝'
      case 'progress': return '📊'
      case 'completion': return '🎉'
      default: return '📌'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm">
                {activity.type === 'enrollment' && `Enrolled in ${activity.course}`}
                {activity.type === 'progress' && `${activity.progress}% complete in ${activity.course}`}
                {activity.type === 'completion' && `Completed ${activity.course}`}
              </p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <p className="text-center text-gray-500 py-4">No recent activity</p>
      )}
    </div>
  )
}
