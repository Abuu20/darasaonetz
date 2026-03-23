import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useTheme } from '../../context/ThemeContext'

export default function DashboardLayout() {
  const { isMobile, sidebarOpen } = useTheme()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main 
        className={`
          pt-16 transition-all duration-300
          ${!isMobile && sidebarOpen ? 'lg:pl-64' : ''}
        `}
      >
        <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
