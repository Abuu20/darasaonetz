import React from 'react'

const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-500 dark:text-gray-400 font-medium">
          {getInitials(alt)}
        </span>
      )}
    </div>
  )
}

export default Avatar
