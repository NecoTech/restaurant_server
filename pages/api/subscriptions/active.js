import dbConnect from '../../../lib/dbConnect';
import Subscription from '../../../models/Subscription';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const subscription = await Subscription.findOne({
                userId: req.admin._id,
                status: 'active'
            });

            res.status(200).json(subscription);
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
}

export default withCors(handler);
