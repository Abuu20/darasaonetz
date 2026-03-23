import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../ui'
import PaymentModal from './PaymentModal'

export default function ShoppingCart({ cart, removeFromCart, updateQuantity, onClose }) {
    const [showPayment, setShowPayment] = useState(false)
    const [processing, setProcessing] = useState(false)

    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

    const handleCheckout = () => {
        if (cart.length === 0) return
        setShowPayment(true)
    }

    const handlePaymentSuccess = () => {
        // Clear cart after successful payment
        cart.forEach(item => removeFromCart(item.id))
        onClose()
    }

    return (
        <>
            <Card className="w-full max-w-md">
                <Card.Header className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Shopping Cart</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </Card.Header>
                <Card.Body>
                    {cart.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">Your cart is empty</p>
                            <Link to="/student/browse">
                                <Button variant="primary">Browse Courses</Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-start border-b pb-2">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-sm text-gray-500">TZS {item.price.toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between font-bold mb-4">
                                    <span>Total:</span>
                                    <span>TZS {total.toLocaleString()}</span>
                                </div>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                >
                                    Checkout
                                </Button>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            <PaymentModal
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                items={cart.map(item => ({ id: item.id, title: item.title, price: item.price }))}
                total={total}
                onSuccess={handlePaymentSuccess}
            />
        </>
    )
}
