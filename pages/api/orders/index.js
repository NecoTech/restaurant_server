import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    switch (method) {
        case 'POST':
            try {
                const {
                    orderNumber,
                    items,
                    subtotal,
                    tax,
                    total,
                    tableNumber,
                    paymentMethod,
                    paid,
                    userId,
                    restaurantId,
                    phonenumber,
                    orderStatus
                } = req.body;

                // Validate required fields
                if (!orderNumber || !items || !restaurantId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields'
                    });
                }

                // Validate items array
                if (!Array.isArray(items) || items.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Order must contain at least one item'
                    });
                }

                // Create order object with all fields
                const orderData = {
                    orderNumber,
                    items: items.map(item => ({
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    subtotal: Number(subtotal),
                    tax: Number(tax),
                    total: Number(total),
                    tableNumber,
                    paymentMethod,
                    paid: Boolean(paid),
                    userId,
                    restaurantId,
                    phonenumber,
                    orderStatus: orderStatus || 'Notcomplete'
                };

                // console.log('Creating new order with data:', orderData);

                const newOrder = new Order(orderData);
                const savedOrder = await newOrder.save();

                // console.log('Order saved successfully:', savedOrder);

                res.status(201).json({
                    success: true,
                    data: savedOrder
                });

            } catch (error) {
                console.error('Error saving order:', error);
                res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to save order',
                    error: process.env.NODE_ENV === 'development' ? error : undefined
                });
            }
            break;

        default:
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);