import React from 'react'
import { formatLocalTime } from '../utils/timeHelpers'

const CountdownTimer = ({ timeRemaining, studentTimezone }) => {
  if (!timeRemaining) return null
  
  const isSoon = timeRemaining.isSoon
  const textColor = timeRemaining.type === 'scheduled' 
    ? (isSoon ? 'text-orange-600 animate-pulse' : 'text-blue-600')
    : 'text-red-600'
  const bgColor = timeRemaining.type === 'scheduled'
    ? (isSoon ? 'bg-orange-100' : 'bg-blue-100')
    : 'bg-red-100'
  
  return (
    <div className={`${bgColor} dark:${bgColor.replace('100', '900/30')} rounded-lg p-3 md:p-4 inline-block transition-all duration-300 shadow-lg`}>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          {timeRemaining.type === 'scheduled' && (
            <span className="text-2xl">⏰</span>
          )}
          {timeRemaining.type === 'expiring' && (
            <span className="text-2xl">⚠️</span>
          )}
          <div className={`text-2xl md:text-4xl font-mono font-bold ${textColor} ${isSoon ? 'animate-pulse' : ''}`}>
            {timeRemaining.text}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {timeRemaining.type === 'scheduled' 
            ? '⏳ Quiz will be available in' 
            : '⚠️ Quiz expires in'}
        </p>
        {timeRemaining.type === 'scheduled' && timeRemaining.targetDate && (
          <p className="text-xs text-gray-500 mt-1">
            Available at: {formatLocalTime(timeRemaining.targetDate)}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">
          Your timezone: {studentTimezone}
        </p>
      </div>
    </div>
  )
}

export default CountdownTimer