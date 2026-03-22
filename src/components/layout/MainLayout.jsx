import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { useAuth } from '../../context/AuthContext'

export default function MainLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16">
        {user && <Sidebar />}
        
        <main className={`flex-1 ${user ? 'lg:ml-64' : ''} transition-all duration-300`}>
          <div className="container mx-auto px-4 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}
