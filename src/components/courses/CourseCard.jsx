import { Link } from 'react-router-dom'
import { Card, Button } from '../ui'
import RatingStars from '../ui/RatingStars'
import { useCart } from '../../context/CartContext'

export default function CourseCard({ course, progress, enrollmentId, isTeacher = false }) {
  const { addToCart } = useCart()
  const courseData = course.courses || course
  const priceValue = parseFloat(courseData.price) || 0
  const isPaid = priceValue > 0

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(courseData)
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
      {/* Thumbnail */}
      <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-500 relative">
        {courseData.thumbnail_url ? (
          <img 
            src={courseData.thumbnail_url} 
            alt={courseData.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-4xl">
            📚
          </div>
        )}
        {progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {(courseData.average_rating > 0 || courseData.review_count > 0) && (
          <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
            <RatingStars rating={courseData.average_rating} readonly size="sm" />
            <span className="text-xs text-white ml-1">
              ({courseData.review_count})
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{courseData.title}</h3>
        
        {!isTeacher && (courseData.average_rating > 0 || courseData.review_count > 0) && (
          <div className="flex items-center gap-2 mb-2">
            <RatingStars rating={courseData.average_rating} readonly size="sm" />
            <span className="text-xs text-gray-500">
              ({courseData.review_count})
            </span>
          </div>
        )}
        
        {!isTeacher && (
          <p className="text-sm text-gray-500 mb-2">
            {courseData.level} • {courseData.profiles?.full_name?.split(' ')[0] || 'Instructor'}
          </p>
        )}

        {isTeacher && (
          <div className="flex gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded ${
              courseData.status === 'published' ? 'bg-green-100 text-green-700' :
              courseData.status === 'pending' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {courseData.status}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {courseData.lessons?.count || 0} lessons
            </span>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {courseData.description}
        </p>
        
        <div className="flex items-center justify-between">
          {!isTeacher && progress !== undefined ? (
            <span className="text-sm font-medium text-green-600">
              {progress}% Complete
            </span>
          ) : !isTeacher && (
            <div>
              {isPaid ? (
                <span className="text-lg font-bold text-blue-600">
                  TZS {priceValue.toLocaleString()}
                </span>
              ) : (
                <span className="text-lg font-bold text-green-600">
                  Free
                </span>
              )}
            </div>
          )}

          {isTeacher && (
            <span className="text-sm font-medium text-gray-600">
              👥 {courseData.enrollments?.length || 0} students
            </span>
          )}
          
          <div className="flex gap-2">
            {!isTeacher ? (
              <>
                <Link 
                  to={`/student/course/${courseData.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {progress ? 'Continue →' : 'View Course →'}
                </Link>
                {!progress && isPaid && (
                  <button
                    onClick={handleAddToCart}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700"
                  >
                    Add to Cart
                  </button>
                )}
              </>
            ) : (
              <Link 
                to={`/teacher/courses/${courseData.id}/lessons`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Manage Lessons →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
