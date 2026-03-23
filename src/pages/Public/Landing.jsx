import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Learn Islamic
            <span className="text-blue-600"> Knowledge</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-10">
            Online courses from expert teachers
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/register?role=student" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Start Learning
            </Link>
            <Link 
              to="/register?role=teacher" 
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Become a Teacher
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex justify-center gap-12 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">100+</div>
              <div className="text-gray-500 text-sm">Courses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">50+</div>
              <div className="text-gray-500 text-sm">Teachers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">1000+</div>
              <div className="text-gray-500 text-sm">Students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
