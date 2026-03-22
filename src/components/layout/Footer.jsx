import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function Footer() {
  const { isMobile } = useTheme()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
      <div className="w-full px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Brand */}
            <div>
              <h3 className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">Darasaone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Digital Admin Management Platform for Teachers
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Students */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">For Students</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/student/browse" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    Browse Courses
                  </Link>
                </li>
                <li>
                  <Link to="/student/my-courses" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    My Learning
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Teachers */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">For Teachers</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/teacher" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    Teacher Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/teacher/courses/new" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                    Create Course
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t dark:border-gray-700 mt-6 md:mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Darasaone. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link to="/privacy" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                Terms of Service
              </Link>
              <a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                Facebook
              </a>
              <a href="#" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
