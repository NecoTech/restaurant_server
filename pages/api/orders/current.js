import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    if (method === 'GET') {
        try {
            const { restaurantId } = query;

            if (!restaurantId) {
                return res.status(400).json({ message: 'Restaurant ID is required' });
            }

            // Get today's start and end time in local timezone
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const orders = await Order.find({
                restaurantId,
                orderStatus: {
                    $nin: ['Notcomplete', 'Cancelled']
                },
                paid: {
                    $nin: [true]
                },
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 });

            const response = {
                count: orders.length,
                latestOrder: orders.length > 0 ? {
                    id: orders[0]._id,
                    orderNumber: orders[0].orderNumber,
                    total: orders[0].total,
                    orderStatus: orders[0].orderStatus,
                    createdAt: orders[0].createdAt,
                    userId: orders[0].userId
                } : null,
                orders: orders.map(order => ({
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    total: order.total,
                    orderStatus: order.orderStatus,
                    createdAt: order.createdAt,
                    items: order.items,
                    paymentMethod: order.paymentMethod,
                    user: order.userId
                }))
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Current Orders API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);