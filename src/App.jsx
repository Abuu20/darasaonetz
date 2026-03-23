import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CourseProvider } from './context/CourseContext'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { router } from './router'

function App() {
  return (
    <CartProvider>
      <ThemeProvider>
        <AuthProvider>
          <CourseProvider>
            <RouterProvider router={router} />
          </CourseProvider>
        </AuthProvider>
      </ThemeProvider>
    </CartProvider>
  )
}

export default App
