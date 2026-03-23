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

  // Apply dark mode class to html element
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
    
    showToast: (message, type = 'info') => {
      const id = Date.now()
      const notification = { message, type, isToast: true, id }
      setNotifications(prev => [notification, ...prev])
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, 3000)
      return id
    },
    showSuccess: (message) => value.showToast(message, 'success'),
    showError: (message) => value.showToast(message, 'error'),
    showInfo: (message) => value.showToast(message, 'info'),
    showWarning: (message) => value.showToast(message, 'warning'),
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
