import { useTheme } from '../../context/ThemeContext'

export default function ResponsiveButton({ children, variant = 'primary', onClick, className = '', fullWidth = false }) {
  const { isMobile } = useTheme()
  
  const size = isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  }
  
  return (
    <button
      onClick={onClick}
      className={`
        ${variants[variant]}
        ${size}
        rounded-lg font-medium transition-all duration-200
        active:transform active:scale-95
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
