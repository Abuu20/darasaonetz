import { useState } from 'react' 
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui'
import DesktopNavbar from './DesktopNavbar'
import MobileNavbar from './MobileNavbar'
import LanguageSwitcher from '../../i18n/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { isMobile } = useTheme()
  const location = useLocation()
  const { user } = useAuth()
  
  const publicPages = ['/', '/about', '/login', '/register']
  const isPublicPage = publicPages.includes(location.pathname)
  
  if (isPublicPage) {
    return <PublicNavbar />
  }
  
  return isMobile ? <MobileNavbar /> : <DesktopNavbar />
}

function PublicNavbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isMobile } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Now using the imported useState
  
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
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-gray-700 dark:text-gray-200 hover:text-blue-600 transition ${
              isLandingPage ? 'text-blue-600 font-semibold' : ''
            }`}>
              {t('navigation.home')}
            </Link>
            <Link to="/about" className={`text-gray-700 dark:text-gray-200 hover:text-blue-600 transition ${
              isAboutPage ? 'text-blue-600 font-semibold' : ''
            }`}>
              {t('navigation.about')}
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Language Switcher */}
            {!isMobile && (
              <LanguageSwitcher variant="dropdown" />
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Desktop Auth Buttons */}
            {!isLoginPage && !isRegisterPage && (
              <div className="hidden sm:flex items-center gap-2">
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
        
        {/* Mobile Menu - Fullscreen overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 md:hidden">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <Link 
                  to="/" 
                  className="text-xl font-bold text-blue-600 dark:text-blue-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Darasaone
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Menu Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <Link 
                      to="/" 
                      className={`block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        isLandingPage ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🏠 {t('navigation.home')}
                    </Link>
                    <Link 
                      to="/about" 
                      className={`block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        isAboutPage ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      ℹ️ {t('navigation.about')}
                    </Link>
                  </div>
                  
                  {/* Language Switcher in Mobile Menu */}
                  <div className="pt-4 border-t dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 px-4">
                      {t('common.language')}
                    </p>
                    <LanguageSwitcher variant="buttons" />
                  </div>
                  
                  {/* Auth Buttons in Mobile Menu */}
                  {!isLoginPage && !isRegisterPage && (
                    <div className="pt-4 border-t dark:border-gray-700 space-y-2">
                      <Link 
                        to="/login" 
                        className="block px-4 py-3 rounded-lg text-center text-blue-600 border border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('auth.signIn')}
                      </Link>
                      <Link 
                        to="/register" 
                        className="block px-4 py-3 rounded-lg text-center bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('auth.signUp')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}