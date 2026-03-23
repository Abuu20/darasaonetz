import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Avatar } from '../ui'

export default function Sidebar() {
  const location = useLocation()
  const { user, profile } = useAuth()
  const { sidebarOpen, toggleSidebar, isMobile, isTouch } = useTheme()

  // Only show sidebar on dashboard pages
  const isDashboardPage = location.pathname.includes('/student') || 
                          location.pathname.includes('/teacher') || 
                          location.pathname.includes('/admin')

  if (!isDashboardPage || !user) return null

  const getNavItems = () => {
    if (!profile) return []

    switch (profile.role) {
      case 'admin':
        return [
          { path: '/admin', icon: '📊', label: 'Dashboard' },
          { path: '/admin/users', icon: '👥', label: 'Users' },
          { path: '/admin/courses', icon: '📚', label: 'Courses' },
          { path: '/admin/certificates', icon: '🎓', label: 'Certificates' },
          { path: '/admin/reports', icon: '📈', label: 'Reports' },
          { path: '/admin/settings', icon: '⚙️', label: 'Settings' }
        ]
      
      case 'teacher':
        return [
          { path: '/teacher', icon: '📊', label: 'Dashboard' },
          { path: '/teacher/courses', icon: '📚', label: 'My Courses' },
          { path: '/teacher/courses/new', icon: '➕', label: 'Create Course' },
          { path: '/teacher/students', icon: '👥', label: 'Students' },
          { path: '/teacher/certificates', icon: '🎓', label: 'Certificates' },
          { path: '/teacher/analytics', icon: '📈', label: 'Analytics' },
          { path: '/teacher/profile', icon: '👤', label: 'Profile' }
        ]
      
      case 'student':
        return [
          { path: '/student', icon: '📊', label: 'Dashboard' },
          { path: '/student/my-courses', icon: '📚', label: 'My Courses' },
          { path: '/student/browse', icon: '🔍', label: 'Browse Courses' },
          { path: '/student/wishlist', icon: '❤️', label: 'Wishlist' },
          { path: '/student/profile', icon: '👤', label: 'Profile' },
          { path: '/student/notes', icon: '📝', label: 'My Notes' }

        ]
      
      default:
        return []
    }
  }

  const navItems = getNavItems()
  const touchClass = isTouch ? 'active:bg-gray-200' : 'hover:bg-gray-100'

  // Don't render sidebar on mobile if not open
  if (isMobile && !sidebarOpen) return null

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50
        transition-all duration-300 ease-in-out
        ${isMobile ? 'w-64' : 'w-64'}
        ${!sidebarOpen && !isMobile ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Close button for mobile */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        )}

        {/* Collapse button for desktop */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        )}

        {/* User info */}
        <div className="p-4 border-b dark:border-gray-700 mt-16">
          <div className="flex items-center gap-3">
            <Avatar
              src={profile?.avatar_url}
              alt={profile?.full_name || user?.email}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={isMobile ? toggleSidebar : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${location.pathname === item.path
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                  : `text-gray-700 dark:text-gray-200 ${touchClass}`
                }
                ${isTouch ? 'min-h-[48px]' : ''}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
