// Helper functions for time and date operations
export const formatLocalTime = (utcString) => {
  if (!utcString) return null
  const date = new Date(utcString)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })
}

export const isDateInFuture = (dateString) => {
  if (!dateString) return false
  return new Date(dateString) > new Date()
}

export const isDateInPast = (dateString) => {
  if (!dateString) return false
  return new Date(dateString) <= new Date()
}

export const getDetailedTimeRemaining = (targetDate) => {
  if (!targetDate) return null
  const now = new Date()
  const target = new Date(targetDate)
  if (target <= now) return null
  
  const diffMs = target - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)
  
  if (diffDays > 0) {
    return { 
      text: `${diffDays}d ${diffHrs.toString().padStart(2, '0')}h ${diffMins.toString().padStart(2, '0')}m ${diffSecs.toString().padStart(2, '0')}s`,
      shortText: `${diffDays}d ${diffHrs}h`,
      full: `${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHrs} hour${diffHrs !== 1 ? 's' : ''}, ${diffMins} minute${diffMins !== 1 ? 's' : ''}, ${diffSecs} second${diffSecs !== 1 ? 's' : ''}`, 
      seconds: Math.floor(diffMs / 1000),
      isSoon: diffDays === 0 && diffHrs < 1
    }
  }
  if (diffHrs > 0) {
    return { 
      text: `${diffHrs.toString().padStart(2, '0')}h ${diffMins.toString().padStart(2, '0')}m ${diffSecs.toString().padStart(2, '0')}s`,
      shortText: `${diffHrs}h ${diffMins}m`,
      full: `${diffHrs} hour${diffHrs !== 1 ? 's' : ''}, ${diffMins} minute${diffMins !== 1 ? 's' : ''}, ${diffSecs} second${diffSecs !== 1 ? 's' : ''}`, 
      seconds: Math.floor(diffMs / 1000),
      isSoon: diffHrs === 0 && diffMins < 5
    }
  }
  if (diffMins > 0) {
    return { 
      text: `${diffMins.toString().padStart(2, '0')}m ${diffSecs.toString().padStart(2, '0')}s`,
      shortText: `${diffMins}m`,
      full: `${diffMins} minute${diffMins !== 1 ? 's' : ''}, ${diffSecs} second${diffSecs !== 1 ? 's' : ''}`, 
      seconds: Math.floor(diffMs / 1000),
      isSoon: diffMins < 5
    }
  }
  return { 
    text: `${diffSecs.toString().padStart(2, '0')}s`,
    shortText: `${diffSecs}s`,
    full: `${diffSecs} second${diffSecs !== 1 ? 's' : ''}`, 
    seconds: Math.floor(diffMs / 1000), 
    isSoon: true 
  }
}