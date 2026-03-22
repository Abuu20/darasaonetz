import { useTheme } from '../../context/ThemeContext'

export default function ResponsiveCard({ children, className = '', onClick }) {
  const { isMobile } = useTheme()
  
  const padding = isMobile ? 'p-4' : 'p-6'
  
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md 
        hover:shadow-lg transition-all duration-300
        ${padding} ${className}
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
      `}
    >
      {children}
    </div>
  )
}
