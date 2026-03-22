import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function Landing() {
  const { isMobile } = useTheme()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      {/* Hero Section - Simple and Clean */}
      <div className="w-full px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
            Learn Islamic Knowledge
            <span className="block text-yellow-300">Anywhere, Anytime</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of students learning Quran, Arabic, and Islamic Studies from expert teachers
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link 
              to="/register?role=student" 
              className="w-full sm:w-auto bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Learning
            </Link>
            <Link 
              to="/register?role=teacher" 
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              Start Teaching
            </Link>
          </div>
          
          {/* Simple Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16">
            <div>
              <div className="text-2xl sm:text-3xl font-bold">100+</div>
              <div className="text-xs sm:text-sm text-blue-100">Courses</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">50+</div>
              <div className="text-xs sm:text-sm text-blue-100">Teachers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">1000+</div>
              <div className="text-xs sm:text-sm text-blue-100">Students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
