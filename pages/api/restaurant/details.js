import dbConnect from '../../../lib/dbConnect';
import Restaurant from '../../../models/Restaurant';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { email } = req.query;
            const restaurant = await Restaurant.findOne({
                ownerEmail: email,
                // active: true
            });

            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }

            res.status(200).json(restaurant);
        });
    } catch (error) {
        console.error('Restaurant fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch restaurant details' });
    }
}

export default withCors(handler);