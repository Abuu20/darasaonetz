import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useCart } from '../../context/CartContext'
import { Avatar, Button } from '../ui'
import NotificationBell from '../ui/NotificationBell'
import LanguageSwitcher from '../../i18n/LanguageSwitcher'

export default function DesktopNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { theme, toggleTheme, toggleSidebar, isMobile } = useTheme()
  const { cartCount } = useCart()
  const { t } = useTranslation()
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
          {/* Left section */}
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

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {user && isDashboardPage ? (
              <>
                <Link to={getDashboardLink()} className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                  {t('navigation.dashboard')}
                </Link>
                {profile?.role === 'student' && (
                  <>
                    <Link to="/student/my-courses" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      {t('navigation.myCourses')}
                    </Link>
                    <Link to="/student/browse" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      {t('courses.browseCourses')}
                    </Link>
                    <Link to="/student/wishlist" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      Wishlist
                    </Link>
                    <Link to="/student/notes" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                      Notes
                    </Link>
                  </>
                )}
                {profile?.role === 'teacher' && (
                  <Link to="/teacher/courses" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                    {t('navigation.myCourses')}
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link to="/admin/users" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                    Users
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600">
                  {t('navigation.home')}
                </Link>
                <Link to="/about" className="text-gray-700 dark:text-gray-200 hover:text-blue-600">
                  {t('navigation.about')}
                </Link>
              </>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher - Visible on desktop */}
            <LanguageSwitcher variant="dropdown" />
            
            {/* Cart Icon */}
            {user && profile?.role === 'student' && (
              <Link to="/student/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* User Menu */}
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
                      {t('navigation.profile')}
                    </Link>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {t('navigation.dashboard')}
                    </Link>
                    {profile?.role === 'student' && (
                      <Link
                        to="/student/notes"
                        className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Notes
                      </Link>
                    )}
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t('auth.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">{t('auth.signIn')}</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">{t('auth.signUp')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}