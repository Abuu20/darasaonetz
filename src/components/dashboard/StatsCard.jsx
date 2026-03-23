import { useTheme } from '../../context/ThemeContext'

export default function StatsCard({ title, value, icon, color = 'blue' }) {
  const { isMobile } = useTheme()
  
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }
  
  const bgGradients = {
    blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    green: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    purple: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    orange: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
  }

  if (isMobile) {
    return (
      <div className={`${bgGradients[color]} rounded-xl p-4 flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${gradients[color]} flex items-center justify-center text-white text-2xl shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${bgGradients[color]} rounded-xl p-6 border border-gray-100 dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${gradients[color]} flex items-center justify-center text-2xl text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
