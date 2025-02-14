import { NextResponse } from 'next/server'

const CASHFREE_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.cashfree.com'
    : 'https://sandbox.cashfree.com'

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json()

        const response = await fetch(`${CASHFREE_API_URL}/pg/orders/${orderId}`, {
            headers: {
                'x-client-id': process.env.CASHFREE_APP_ID!,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
                'x-api-version': '2022-09-01'
            }
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to verify payment')
        }

        // Update order status in your database here
        if (data.order_status === 'PAID') {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paid: true,
                    orderStatus: "Processing"
                }),
            })
        }

        return NextResponse.json({
            status: data.order_status,
            payment_method: data.payment_method,
            transaction_id: data.cf_transaction_id
        })
    } catch (error) {
        console.error('Payment verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        )
    }
}