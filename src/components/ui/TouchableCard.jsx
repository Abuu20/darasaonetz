import { useState } from 'react'

export default function TouchableCard({ children, onClick, className = '' }) {
  const [isPressed, setIsPressed] = useState(false)
  
  const handleTouchStart = () => setIsPressed(true)
  const handleTouchEnd = () => {
    setIsPressed(false)
    if (onClick) onClick()
  }
  
  return (
    <div
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md 
        transition-all duration-200 cursor-pointer
        ${isPressed ? 'scale-95 opacity-75' : 'scale-100'}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
