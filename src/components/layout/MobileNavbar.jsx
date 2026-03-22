import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar, Button } from '../ui'
import MobileMenu from '../ui/MobileMenu'
import NotificationBell from '../ui/NotificationBell'

export default function MobileNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { theme, toggleTheme, isMobile } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  
  const isLandingPage = location.pathname === '/'

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  const getDashboardLink = () => {
    if (!profile) return '/'
    switch (profile.role) {
      case 'admin': return '/admin'
      case 'teacher': return '/teacher'
      default: return '/student'
    }
  }

  // Only render on mobile
  if (!isMobile) return null

  // If not logged in on landing page, don't show this navbar (SimpleNavbar handles it)
  if (isLandingPage && !user) return null

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full top-0 z-40">
        <div className="px-3 py-2 flex justify-between items-center">
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo */}
          <Link to="/" className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Darasaone
          </Link>
          
          {/* Right Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* Only show notification bell when user is logged in */}
            {user && <NotificationBell />}
            
            {user ? (
              <div className="ml-1">
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.full_name || user.email}
                  size="sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
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
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="space-y-4">
          {user ? (
            <>
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.full_name || user.email}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email || user.email}</p>
                    <p className="text-xs text-blue-600 capitalize mt-1">{profile?.role}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  📊 Dashboard
                </Link>
                
                {profile?.role === 'student' && (
                  <>
                    <Link
                      to="/student/my-courses"
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      📚 My Courses
                    </Link>
                    <Link
                      to="/student/browse"
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      🔍 Browse Courses
                    </Link>
                    <Link
                      to="/student/wishlist"
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      ❤️ Wishlist
                    </Link>
                  </>
                )}
                
                {profile?.role === 'teacher' && (
                  <>
                    <Link
                      to="/teacher/courses"
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      📚 My Courses
                    </Link>
                    <Link
                      to="/teacher/courses/new"
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      ➕ Create Course
                    </Link>
                    <Link
                      to="/teacher/students"
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      👥 Students
                    </Link>
                  </>
                )}
                
                <Link
                  to={`/${profile?.role}/profile`}
                  className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setMenuOpen(false)}
                >
                  👤 Profile
                </Link>
                
                <hr className="my-3 border-gray-200 dark:border-gray-700" />
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                >
                  🚪 Logout
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/"
                className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link
                to="/about"
                className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMenuOpen(false)}
              >
                ℹ️ About
              </Link>
              <hr className="my-4 border-gray-200 dark:border-gray-700" />
              <Link
                to="/login"
                className="block px-4 py-3 rounded-lg text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMenuOpen(false)}
              >
                🔑 Login
              </Link>
              <Link
                to="/register"
                className="block px-4 py-3 rounded-lg bg-blue-600 text-white text-center"
                onClick={() => setMenuOpen(false)}
              >
                📝 Sign Up
              </Link>
            </div>
          )}
        </div>
      </MobileMenu>
    </>
  )
}
