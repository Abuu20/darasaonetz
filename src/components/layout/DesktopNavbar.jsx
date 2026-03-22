import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar, Button } from '../ui'
import NotificationBell from '../ui/NotificationBell'

export default function DesktopNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { theme, toggleTheme, toggleSidebar, isMobile } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!profile) return '/'
    switch (profile.role) {
      case 'admin': return '/admin'
      case 'teacher': return '/teacher'
      default: return '/student'
    }
  }

  const isDashboardPage = location.pathname.includes('/student') || 
                          location.pathname.includes('/teacher') || 
                          location.pathname.includes('/admin')

  if (isMobile) return null

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 sm:gap-4">
            {user && isDashboardPage && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              Darasaone
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {user && isDashboardPage ? (
              <>
                <Link to={getDashboardLink()} className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                  Dashboard
                </Link>
                {profile?.role === 'student' && (
                  <>
                    <Link to="/student/my-courses" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      My Courses
                    </Link>
                    <Link to="/student/browse" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      Browse
                    </Link>
                    <Link to="/student/wishlist" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      Wishlist
                    </Link>
                  </>
                )}
                {profile?.role === 'teacher' && (
                  <Link to="/teacher/courses" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                    My Courses
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600">
                  Home
                </Link>
                <Link to="/about" className="text-gray-700 dark:text-gray-200 hover:text-blue-600">
                  About
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user && <NotificationBell />}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name || user.email}
                    size="sm"
                  />
                  <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-200">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                    <Link
                      to={`/${profile?.role}/profile`}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
