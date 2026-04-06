import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Button, Input } from '../ui'
import { useTheme } from '../../context/ThemeContext'

export default function PaymentModal({ isOpen, onClose, items, total, onSuccess }) {
  const { t } = useTranslation()
  const { showSuccess, showError } = useTheme()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!paymentMethod) {
      showError('Please select a payment method')
      return
    }

    if (['mpesa', 'tigo_pesa', 'airtel_money', 'azampay'].includes(paymentMethod) && !phoneNumber) {
      showError('Please enter your phone number')
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      showSuccess(`${t('payment.pay')} TZS ${total.toLocaleString()} ${t('payment.success') || 'processed successfully!'}`)
      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      console.error('Payment error:', error)
      showError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = [
    { value: 'mpesa', label: t('payment.mpesa'), icon: '📱', desc: t('payment.payWithMpesa'), iconBg: 'bg-green-500' },
    { value: 'tigo_pesa', label: t('payment.tigoPesa'), icon: '📱', desc: t('payment.payWithTigo'), iconBg: 'bg-blue-500' },
    { value: 'airtel_money', label: t('payment.airtelMoney'), icon: '📱', desc: t('payment.payWithAirtel'), iconBg: 'bg-red-500' },
    { value: 'azampay', label: t('payment.azamPay'), icon: '💳', desc: t('payment.payWithAzam'), iconBg: 'bg-purple-500' },
    { value: 'bank', label: t('payment.bankTransfer'), icon: '🏦', desc: t('payment.bankAccounts'), iconBg: 'bg-gray-600' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payment.title')} size="md">
      <div className="space-y-5">
        {/* Payment Methods */}
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-3 font-semibold text-sm md:text-base">
            {t('payment.selectMethod')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentMethods.map(method => (
              <label
                key={method.value}
                className={`
                  flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${paymentMethod === method.value
                    ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                  }
                `}
              >
                <input
                  type="radio"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="hidden"
                />
                <div className={`w-10 h-10 rounded-full ${method.iconBg} flex items-center justify-center text-xl text-white flex-shrink-0`}>
                  {method.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm md:text-base">{method.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</p>
                </div>
                {paymentMethod === method.value && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Phone Number Input */}
        {['mpesa', 'tigo_pesa', 'airtel_money', 'azampay'].includes(paymentMethod) && (
          <div className="animate-fadeIn">
            <Input
              label={t('payment.phoneNumber')}
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712 345 678"
              required
              className="text-center text-base md:text-lg"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {t('payment.phoneHint')}
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h3 className="font-semibold text-sm md:text-base mb-3 text-center">{t('payment.orderSummary')}</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-4">
                  {item.title}
                </span>
                <span className="font-medium whitespace-nowrap">
                  TZS {item.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t dark:border-gray-700 pt-3 mt-3 font-bold flex justify-between text-sm md:text-base">
            <span>{t('payment.total')}</span>
            <span className="text-blue-600 dark:text-blue-400 text-base md:text-lg">
              TZS {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {paymentMethod === 'bank' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center animate-fadeIn">
            <p className="font-semibold text-sm mb-2">{t('payment.bankDetails')}</p>
            <p className="text-sm">{t('payment.bankAccounts')}</p>
            <p className="text-sm font-mono mt-1">Darasaone Limited</p>
            <p className="text-sm font-mono">01-234567-89</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('payment.bankHint')}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            fullWidth
            className="order-2 sm:order-1"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            variant="primary"
            fullWidth
            className="order-1 sm:order-2"
          >
            {loading ? t('payment.processing') : `${t('payment.pay')} TZS ${total.toLocaleString()}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}