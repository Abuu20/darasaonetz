import { useState } from 'react'
import { Modal, Button, Input } from '../ui'

export default function PaymentModal({ isOpen, onClose, items, total, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }

    setLoading(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(`Payment of TZS ${total.toLocaleString()} processed successfully!`)
      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = [
    { value: 'mpesa', label: 'M-Pesa', icon: '📱', description: 'Pay with M-Pesa', color: 'bg-green-50 dark:bg-green-900/20' },
    { value: 'tigo_pesa', label: 'Tigo Pesa', icon: '📱', description: 'Pay with Tigo Pesa', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: 'airtel_money', label: 'Airtel Money', icon: '📱', description: 'Pay with Airtel Money', color: 'bg-red-50 dark:bg-red-900/20' },
    { value: 'azampay', label: 'AzamPay', icon: '💳', description: 'Pay with AzamPay', color: 'bg-purple-50 dark:bg-purple-900/20' },
    { value: 'bank', label: 'Bank Transfer', icon: '🏦', description: 'CRDB, NMB, NBC', color: 'bg-yellow-50 dark:bg-yellow-900/20' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Payment Methods - Responsive Grid */}
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-3 font-medium text-sm md:text-base">
            Select Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {paymentMethods.map(method => (
              <label
                key={method.value}
                className={`
                  flex items-center p-3 md:p-4 border rounded-lg cursor-pointer transition-all
                  ${paymentMethod === method.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
                  }
                `}
              >
                <input
                  type="radio"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3 w-4 h-4 md:w-5 md:h-5"
                />
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${method.color} flex items-center justify-center text-xl md:text-2xl mr-3 flex-shrink-0`}>
                  {method.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base">{method.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{method.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Phone Number (for mobile money) */}
        {['mpesa', 'tigo_pesa', 'airtel_money', 'azampay'].includes(paymentMethod) && (
          <div className="animate-fadeIn">
            <Input
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number (e.g., 0712345678)"
              required
              className="text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              You will receive a prompt on your phone to complete payment
            </p>
          </div>
        )}

        {/* Payment Summary - Responsive */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4">
          <h3 className="font-semibold text-sm md:text-base mb-2">Order Summary</h3>
          <div className="space-y-2 text-xs md:text-sm">
            {items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="truncate flex-1 mr-2">{item.title}</span>
                <span className="font-medium whitespace-nowrap">TZS {item.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 font-semibold flex justify-between">
              <span>Total</span>
              <span className="text-blue-600 dark:text-blue-400 text-sm md:text-base">TZS {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {paymentMethod === 'bank' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 md:p-4 animate-fadeIn">
            <p className="font-semibold text-sm md:text-base mb-2">Bank Transfer Details:</p>
            <div className="space-y-1 text-xs md:text-sm">
              <p><span className="font-medium">Bank:</span> CRDB / NMB / NBC</p>
              <p><span className="font-medium">Account Name:</span> Darasaone Limited</p>
              <p><span className="font-medium">Account Number:</span> 01-234567-89</p>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Use your email as reference
            </p>
          </div>
        )}

        {/* Action Buttons - Responsive */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth={false}
            disabled={loading}
            className="w-full sm:w-auto py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay TZS ${total.toLocaleString()}`
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto py-3 text-base"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
