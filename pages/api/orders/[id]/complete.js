import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';
import { withCors } from '../../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'PATCH':
            try {
                const updatedOrder = await Order.findByIdAndUpdate(query.id,
                    { orderStatus: 'Completed' },
                    { new: true }
                );
                if (!updatedOrder) {
                    return res.status(404).json({ message: 'Order not found' });
                }
                res.status(200).json(updatedOrder);
            } catch (error) {
                res.status(400).json({ message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['PATCH']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);