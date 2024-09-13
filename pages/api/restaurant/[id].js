import dbConnect from '../../../lib/dbConnect';
import Restaurant from '../../../models/Restaurant';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const restaurants = await Restaurant.find({ id: query.id });
                res.status(200).json(restaurants);
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