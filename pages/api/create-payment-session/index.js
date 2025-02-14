import { withCors } from '../../../lib/cors';

const CASHFREE_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.cashfree.com'
    : 'https://sandbox.cashfree.com'

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const {
            orderId,
            amount,
            customerName,
            customerPhone,
            orderItems
        } = await req.body;

        console.log(CASHFREE_API_URL, amount);

        const payload = {
            customer_details: {
                customer_id: customerPhone,
                customer_name: customerName,
                customer_phone: customerPhone
            },
            order_meta: {
                order_id: orderId,
                payment_methods: "cc,dc,upi,nb",
            },
            order_amount: Number(amount).toFixed(2),
            order_currency: "INR",
            order_items: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit_price: item.price
            }))
        }

        const response = await fetch(`${CASHFREE_API_URL}/pg/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'x-api-version': '2022-09-01'
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create payment session')
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Payment session creation error:', error)
        res.status(500).json({ error: 'Failed to create payment session' });
    }
}

export default withCors(handler);