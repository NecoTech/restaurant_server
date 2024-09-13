import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    switch (method) {
        case 'POST':
            try {
                const newOrder = new Order(req.body);
                const savedOrder = await newOrder.save();
                res.status(201).json(savedOrder);
            } catch (error) {
                res.status(400).json({ message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);