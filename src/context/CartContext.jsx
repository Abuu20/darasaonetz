import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext({})

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('darasaone-cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('darasaone-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (course) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === course.id)
      if (exists) {
        return prev
      }
      return [...prev, { 
        id: course.id,
        title: course.title,
        price: parseFloat(course.price) || 0,
        thumbnail: course.thumbnail_url,
        quantity: 1 
      }]
    })
  }

  const removeFromCart = (courseId) => {
    setCart(prev => prev.filter(item => item.id !== courseId))
  }

  const updateQuantity = (courseId, quantity) => {
    setCart(prev => prev.map(item => 
      item.id === courseId ? { ...item, quantity: Math.max(1, quantity) } : item
    ))
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const cartCount = cart.length

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  )
}
