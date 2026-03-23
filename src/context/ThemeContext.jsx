import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
  return useContext(ThemeContext)
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('darasaone-theme')
    return savedTheme || 'light'
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts] = useState([])
  
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })
  
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setWindowSize({ width, height: window.innerHeight })
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setIsDesktop(width >= 1024)
    }
    
    const handleTouch = () => {
      setIsTouch(true)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('touchstart', handleTouch)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darasaone-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darasaone-theme', 'light')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  // Toast methods
  const showToast = (message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const showSuccess = (message) => showToast(message, 'success')
  const showError = (message) => showToast(message, 'error')
  const showWarning = (message) => showToast(message, 'warning')
  const showInfo = (message) => showToast(message, 'info')

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    
    notifications,
    addNotification: (notification) => {
      const id = Date.now()
      setNotifications(prev => [{ id, read: false, ...notification }, ...prev])
      return id
    },
    removeNotification: (id) => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    },
    
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
