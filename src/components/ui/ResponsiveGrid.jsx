import { useTheme } from '../../context/ThemeContext'

export default function ResponsiveGrid({ children, className = '' }) {
  const { isMobile, isTablet } = useTheme()
  
  let gridCols = 'grid-cols-1' // default for mobile
  
  if (isTablet) {
    gridCols = 'grid-cols-2'
  } else if (!isMobile && !isTablet) {
    gridCols = 'grid-cols-3 lg:grid-cols-4'
  }
  
  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  )
}
