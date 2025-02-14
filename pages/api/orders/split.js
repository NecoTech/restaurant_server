import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    if (method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    try {
        const { orderId, onlineAmount } = req.body;

        // Get original order
        const originalOrder = await Order.findById(orderId);
        if (!originalOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Calculate remaining amount for counter payment
        const counterAmount = originalOrder.total - onlineAmount;

        // Update original order (counter payment)
        originalOrder.total = counterAmount;
        await originalOrder.save();

        // Create new order for online payment
        const newOrder = new Order({
            orderNumber: originalOrder.orderNumber + "(Split)", // Same order number
            items: originalOrder.items,
            subtotal: (onlineAmount / (1 + originalOrder.tax / originalOrder.subtotal)).toFixed(2),
            tax: (onlineAmount - (onlineAmount / (1 + originalOrder.tax / originalOrder.subtotal))).toFixed(2),
            total: onlineAmount,
            tableNumber: originalOrder.tableNumber,
            paymentMethod: 'googlepay',
            paid: true,
            userId: originalOrder.userId,
            restaurantId: originalOrder.restaurantId,
            phonenumber: originalOrder.phonenumber,
            orderStatus: originalOrder.orderStatus
        });

        await newOrder.save();

        res.status(200).json({
            success: true,
            data: {
                counterOrder: originalOrder,
                onlineOrder: newOrder
            }
        });

    } catch (error) {
        console.error('Error splitting order:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing order split'
        });
    }
}

export default withCors(handler);