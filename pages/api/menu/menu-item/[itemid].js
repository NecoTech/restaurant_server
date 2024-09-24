import dbConnect from '..//..//..//..//lib/dbConnect';
import MenuItem from '..//..//..//..//models/MenuItem';
import { withCors } from '..//..//..//..//lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const item = await MenuItem.findById(query.itemid);
                if (!item) {
                    return res.status(404).json({ message: 'item not found' });
                }
                res.status(200).json(item);
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