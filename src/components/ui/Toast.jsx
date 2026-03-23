import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'info', onClose, duration = 3000, index = 0 }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  const borderColors = {
    success: 'border-green-400',
    error: 'border-red-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400'
  }

  // Calculate position with offset for multiple toasts
  const offset = index * 80

  return (
    <div 
      className={`fixed left-1/2 transform -translate-x-1/2 z-50 pointer-events-none`}
      style={{ top: `calc(50% + ${offset}px)` }}
    >
      <div className={`${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md pointer-events-auto ${isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'} border-l-4 ${borderColors[type]}`}>
        <span className="text-2xl">{icons[type]}</span>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button 
          onClick={() => {
            setIsExiting(true)
            setTimeout(onClose, 200)
          }} 
          className="ml-2 hover:opacity-75 transition-opacity text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
