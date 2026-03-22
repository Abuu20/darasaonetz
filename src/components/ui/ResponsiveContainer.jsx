import { useTheme } from '../../context/ThemeContext'

export default function ResponsiveContainer({ children, className = '' }) {
  const { isMobile, isTablet } = useTheme()
  
  // Responsive padding
  const padding = isMobile ? 'px-4 py-3' : isTablet ? 'px-6 py-4' : 'px-8 py-6'
  
  return (
    <div className={`container mx-auto ${padding} ${className}`}>
      {children}
    </div>
  )
}
