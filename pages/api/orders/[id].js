import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const order = await Order.findById(query.id);
                if (!order) {
                    return res.status(404).json({ message: 'Order not found' });
                }
                res.status(200).json(order);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);