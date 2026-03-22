import { useTheme } from '../../context/ThemeContext'

export default function MobileStatsCard({ title, value, icon, color = 'blue' }) {
  const { isMobile } = useTheme()
  
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }
  
  if (isMobile) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${colors[color]} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${colors[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
