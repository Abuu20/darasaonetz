import React from 'react'
import { Link } from 'react-router-dom'

export default function BeautifulCard({ 
  course, 
  progress, 
  isEnrolled, 
  onEnroll, 
  onAddToCart,
  isTeacher = false 
}) {
  const priceValue = parseFloat(course.price) || 0
  const isPaid = priceValue > 0
  
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500 z-0"></div>
      
      {/* Course Thumbnail with Badge */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-6xl">
            📚
          </div>
        )}
        
        {/* Rating Badge */}
        {course.average_rating > 0 && (
          <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
            <span className="text-yellow-400 text-sm">⭐</span>
            <span className="text-white text-sm font-semibold">{course.average_rating.toFixed(1)}</span>
            <span className="text-gray-300 text-xs">({course.review_count})</span>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 z-20">
          {isPaid ? (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-4 py-1.5 shadow-lg">
              <span className="text-white font-bold text-sm">TZS {priceValue.toLocaleString()}</span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full px-4 py-1.5 shadow-lg">
              <span className="text-white font-bold text-sm">Free</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Course Content */}
      <div className="p-5 relative z-10">
        {/* Category and Level Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {course.level && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {course.level}
            </span>
          )}
          {course.categories?.name && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {course.categories.name}
            </span>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {course.description}
        </p>
        
        {/* Instructor */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
            {course.profiles?.full_name?.charAt(0) || 'T'}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {course.profiles?.full_name || 'Instructor'}
          </span>
          {course.lessons?.count > 0 && (
            <span className="text-xs text-gray-400">• {course.lessons.count} lessons</span>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {isEnrolled ? (
            <Link 
              to={`/student/course/${course.id}`}
              className="flex-1 text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Continue Learning
            </Link>
          ) : isPaid ? (
            <button
              onClick={() => onAddToCart(course)}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Add to Cart
            </button>
          ) : (
            <button
              onClick={() => onEnroll(course.id)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Enroll Free
            </button>
          )}
          
          {/* Wishlist Button */}
          <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
