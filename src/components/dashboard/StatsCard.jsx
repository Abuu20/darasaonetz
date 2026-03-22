import { useTheme } from '../../context/ThemeContext'

export default function StatsCard({ title, value, icon, color = 'blue' }) {
  const { isMobile } = useTheme()
  
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
  }

  if (isMobile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${colorClasses[color]} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-xl sm:text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
