import { useTheme } from '../context/ThemeContext'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../context/CartContext'
import { Card, Button, Spinner } from '../components/ui'
import PaymentModal from '../components/payments/PaymentModal'

export default function ShoppingCart() {
  const { showSuccess, showError, showWarning, showInfo } = useTheme()
  const { cart, removeFromCart, clearCart, cartTotal, cartCount } = useCart()
  const { t } = useTranslation()
  const [showPayment, setShowPayment] = useState(false)

  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setShowPayment(false)
    showInfo(t('cart.paymentSuccess'))
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="text-center max-w-md w-full">
          <div className="text-5xl md:text-6xl mb-4">🛒</div>
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            {t('cart.emptyTitle')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm md:text-base">
            {t('cart.emptyMessage')}
          </p>
          <Link to="/student/browse">
            <Button variant="primary">{t('cart.browseCourses')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
        {t('cart.title')} ({cartCount} {t('cart.items')})
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {cart.map(item => (
            <Card key={item.id} className="p-3 md:p-4">
              <div className="flex gap-3 md:gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl md:text-2xl flex-shrink-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    '📚'
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm md:text-base lg:text-lg text-gray-900 dark:text-white line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
                    {t('cart.courseType')}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 font-bold mt-2 text-sm md:text-base">
                    TZS {item.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors text-sm md:text-base flex-shrink-0"
                  aria-label={t('cart.remove')}
                >
                  {t('cart.remove')}
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-20">
            <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-gray-900 dark:text-white">
              {t('cart.orderSummary')}
            </h2>
            <div className="space-y-2 md:space-y-3 mb-4">
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('cart.subtotal')} ({cartCount} {t('cart.items')})
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  TZS {cartTotal.toLocaleString()}
                </span>
              </div>
              <div className="border-t dark:border-gray-700 pt-2 md:pt-3 font-bold flex justify-between text-sm md:text-base">
                <span className="text-gray-900 dark:text-white">{t('cart.total')}</span>
                <span className="text-blue-600 dark:text-blue-400 text-base md:text-lg">
                  TZS {cartTotal.toLocaleString()}
                </span>
              </div>
            </div>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleCheckout}
              className="py-2 md:py-2.5 text-sm md:text-base"
            >
              {t('cart.proceedToCheckout')}
            </Button>
            <button
              onClick={clearCart}
              className="w-full text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mt-3 transition-colors"
            >
              {t('cart.clearCart')}
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