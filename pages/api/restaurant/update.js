import dbConnect from '../../../lib/dbConnect';
import Restaurant from '../../../models/Restaurant';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { restaurantName, bannerImage, fssaiCode, restaurantType } = req.body;
            const ownerEmail = req.admin.email;

            // Validate restaurant type
            if (restaurantType && !['Restaurant', 'Canteen'].includes(restaurantType)) {
                return res.status(400).json({
                    error: 'Invalid restaurant type. Must be either "Restaurant" or "Canteen"'
                });
            }

            const restaurant = await Restaurant.findOneAndUpdate(
                { ownerEmail },
                {
                    name: restaurantName,
                    bannerImage: bannerImage,
                    fssaiCode: fssaiCode,
                    restaurantType: restaurantType,
                },
                { new: true, upsert: true }
            );

            res.status(200).json(restaurant);
        });
    } catch (error) {
        console.error('Restaurant update error:', error);
        res.status(500).json({ error: 'Failed to update restaurant details' });
    }
}

export default withCors(handler);