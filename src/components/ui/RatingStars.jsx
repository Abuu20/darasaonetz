import { useState } from 'react'

export default function RatingStars({ 
  rating = 0, 
  onRate = null, 
  readonly = false,
  size = 'md',
  showValue = false
}) {
  const [hoverRating, setHoverRating] = useState(0)
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const handleClick = (value) => {
    if (!readonly && onRate) {
      onRate(value)
    }
  }
  
  const displayRating = hoverRating || rating
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`${!readonly ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
            disabled={readonly}
          >
            <svg 
              className={`${sizes[size]} ${
                star <= displayRating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300 dark:text-gray-600 fill-current'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {showValue && rating > 0 && (
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)} / 5
        </span>
      )}
    </div>
  )
}
