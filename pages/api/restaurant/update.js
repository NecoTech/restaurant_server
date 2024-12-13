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

            const { restaurantName, bannerImage, fssaiCode } = req.body;
            const ownerEmail = req.admin.email;
            const restaurant = await Restaurant.findOneAndUpdate(
                { ownerEmail },
                {
                    name: restaurantName,
                    bannerImage: bannerImage,
                    fssaiCode: fssaiCode,
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