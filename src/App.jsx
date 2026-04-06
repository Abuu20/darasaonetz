import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CourseProvider } from './context/CourseContext'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { router } from './router'
import ToastContainer from './components/ui/ToastContainer'
import VerifyEmail from './pages/VerifyEmail'


function App() {
  return (
    <CartProvider>
      <ThemeProvider>
        <AuthProvider>
          <CourseProvider>
            <RouterProvider router={router} />
            <ToastContainer />
          </CourseProvider>
        </AuthProvider>
      </ThemeProvider>
    </CartProvider>
  )
}

export default App