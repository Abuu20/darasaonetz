import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui'
import DesktopNavbar from './DesktopNavbar'
import MobileNavbar from './MobileNavbar'

export default function Navbar() {
  const { isMobile } = useTheme()
  const location = useLocation()
  const { user } = useAuth()
  
  // Public pages that should show the simple navbar (no notification bell, no dashboard links)
  const publicPages = ['/', '/about', '/login', '/register']
  const isPublicPage = publicPages.includes(location.pathname)
  
  // On public pages, always show the simple navbar
  if (isPublicPage) {
    return <PublicNavbar />
  }
  
  // On dashboard pages, use responsive navbar with notification bell for logged-in users
  return isMobile ? <MobileNavbar /> : <DesktopNavbar />
}

// Public navbar - shown on landing, about, login, register pages
function PublicNavbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const isRegisterPage = location.pathname === '/register'
  const isLandingPage = location.pathname === '/'
  const isAboutPage = location.pathname === '/about'
  
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full top-0 z-50">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            Darasaone
          </Link>
          
          {/* Navigation Links for public pages */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-gray-700 dark:text-gray-200 hover:text-blue-600 transition ${
              isLandingPage ? 'text-blue-600 font-semibold' : ''
            }`}>
              Home
            </Link>
            <Link to="/about" className={`text-gray-700 dark:text-gray-200 hover:text-blue-600 transition ${
              isAboutPage ? 'text-blue-600 font-semibold' : ''
            }`}>
              About
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* Mobile menu button for public pages */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Menu"
              onClick={() => {
                // Simple mobile menu toggle for public pages
                const menu = document.getElementById('public-mobile-menu')
                if (menu) {
                  menu.classList.toggle('hidden')
                }
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Don't show login/register buttons on login/register pages */}
            {!isLoginPage && !isRegisterPage && (
              <div className="hidden sm:flex items-center gap-2">
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
        
        {/* Mobile menu for public pages */}
        <div id="public-mobile-menu" className="hidden md:hidden py-4 border-t dark:border-gray-700">
          <div className="flex flex-col space-y-3">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isLandingPage ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-200'
              }`}
              onClick={() => {
                const menu = document.getElementById('public-mobile-menu')
                if (menu) menu.classList.add('hidden')
              }}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isAboutPage ? 'text-blue-600 font-semibold' : 'text-gray-700 dark:text-gray-200'
              }`}
              onClick={() => {
                const menu = document.getElementById('public-mobile-menu')
                if (menu) menu.classList.add('hidden')
              }}
            >
              About
            </Link>
            
            {!isLoginPage && !isRegisterPage && (
              <>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-lg text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    const menu = document.getElementById('public-mobile-menu')
                    if (menu) menu.classList.add('hidden')
                  }}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-center hover:bg-blue-700"
                  onClick={() => {
                    const menu = document.getElementById('public-mobile-menu')
                    if (menu) menu.classList.add('hidden')
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
