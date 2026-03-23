import { supabase } from '../client'

// AzamPay API endpoints (you'll need to register with AzamPay for actual keys)
const AZAMPAY_API_URL = 'https://api.azampay.co.tz/v1'

export const paymentQueries = {
    // Generate unique order number
    generateOrderNumber: () => {
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        return `ORD-${timestamp}-${random}`
    },

    // Create new order
    createOrder: async (studentId, items) => {
        const orderNumber = paymentQueries.generateOrderNumber()
        const totalAmount = items.reduce((sum, item) => sum + item.price, 0)

        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                student_id: studentId,
                order_number: orderNumber,
                total_amount: totalAmount,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // Add order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            course_id: item.course_id,
            price: item.price
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) throw itemsError

        return order
    },

    // Initiate AzamPay payment
    initiateAzamPay: async (orderId, phoneNumber, amount) => {
        // This would normally call AzamPay API
        // For now, simulate the response
        const transactionId = `TXN-${Date.now()}`

        // Store transaction
        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
                order_id: orderId,
                transaction_id: transactionId,
                amount: amount,
                payment_method: 'azampay',
                status: 'pending',
                provider_response: {
                    phone: phoneNumber,
                    initiated_at: new Date().toISOString()
                }
            })
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            transactionId,
            message: 'Payment initiated. Check your phone for STK push.'
        }
    },

    // Initiate Mobile Money payment
    initiateMobileMoney: async (orderId, phoneNumber, amount, provider) => {
        // Map provider names
        const providerMap = {
            'mpesa': 'M-Pesa',
            'tigo_pesa': 'Tigo Pesa',
            'airtel_money': 'Airtel Money'
        }

        const providerName = providerMap[provider] || provider

        // Simulate payment initiation
        const transactionId = `TXN-${Date.now()}`

        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({
                order_id: orderId,
                transaction_id: transactionId,
                amount: amount,
                payment_method: provider,
                status: 'pending',
                provider_response: {
                    phone: phoneNumber,
                    provider: providerName,
                    initiated_at: new Date().toISOString()
                }
            })
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            transactionId,
            message: `Enter your PIN on your phone to complete payment`
        }
    },

    // Confirm payment (webhook)
    confirmPayment: async (transactionId, providerResponse) => {
        // Update transaction
        const { error: txError } = await supabase
            .from('transactions')
            .update({
                status: 'success',
                provider_response: providerResponse,
                completed_at: new Date().toISOString()
            })
            .eq('transaction_id', transactionId)

        if (txError) throw txError

        // Get order from transaction
        const { data: transaction } = await supabase
            .from('transactions')
            .select('order_id')
            .eq('transaction_id', transactionId)
            .single()

        if (!transaction) return

        // Update order
        const { error: orderError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', transaction.order_id)

        if (orderError) throw orderError

        // Get order items and enroll student
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('course_id')
            .eq('order_id', transaction.order_id)

        if (orderItems && orderItems.length > 0) {
            // Enroll student in each course
            for (const item of orderItems) {
                await supabase
                    .from('enrollments')
                    .insert({
                        student_id: (await supabase.auth.getUser()).data.user?.id,
                        course_id: item.course_id,
                        progress: 0,
                        completed_lessons: []
                    })
            }
        }

        return { success: true }
    },

    // Get user's orders
    getUserOrders: async (userId) => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    courses (
                        id,
                        title,
                        thumbnail_url,
                        price
                    )
                ),
                transactions (*)
            `)
            .eq('student_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    // Get order by ID
    getOrder: async (orderId) => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    courses (
                        id,
                        title,
                        thumbnail_url,
                        price,
                        profiles:teacher_id (
                            full_name
                        )
                    )
                ),
                transactions (*)
            `)
            .eq('id', orderId)
            .single()

        if (error) throw error
        return data
    }
}
