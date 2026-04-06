export default function ActivityFeed({ activities }) {
  const getActivityIcon = (type) => {
    switch(type) {
      case 'enrollment': return '📝'
      case 'progress': return '📊'
      case 'completion': return '🎉'
      default: return '📌'
    }
  }

  const getActivityText = (activity) => {
    if (activity.type === 'enrollment') {
      return `Enrolled in ${activity.course}`
    }
    if (activity.type === 'progress') {
      return `${activity.progress}% complete in ${activity.course}`
    }
    if (activity.type === 'completion') {
      return `Completed ${activity.lesson || activity.course}`
    }
    return activity.message || 'Activity'
  }

  const formatTime = (date) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffMs = now - activityDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return activityDate.toLocaleDateString()
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          <p className="text-sm text-gray-400 mt-2">Start learning to see activity here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-lg">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTime(activity.time)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
