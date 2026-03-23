import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { Card, Button, Spinner } from '../components/ui'
import PaymentModal from '../components/payments/PaymentModal'

export default function ShoppingCart() {
  const { cart, removeFromCart, clearCart, cartTotal, cartCount } = useCart()
  const [showPayment, setShowPayment] = useState(false)

  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setShowPayment(false)
    alert('Payment successful! You are now enrolled in your courses.')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Browse our courses and add some to your cart</p>
          <Link to="/student/browse">
            <Button variant="primary">Browse Courses</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({cartCount} items)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <Card key={item.id}>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl flex-shrink-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    '📚'
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-gray-500 text-sm">Course</p>
                  <p className="text-blue-600 font-bold mt-2">
                    TZS {item.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cartCount} items)</span>
                <span className="font-medium">TZS {cartTotal.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 font-bold flex justify-between">
                <span>Total</span>
                <span className="text-blue-600">TZS {cartTotal.toLocaleString()}</span>
              </div>
            </div>
            <Button variant="primary" fullWidth onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
            <button
              onClick={clearCart}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
            >
              Clear Cart
            </button>
          </Card>
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        items={cart.map(item => ({ id: item.id, title: item.title, price: item.price }))}
        total={cartTotal}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
