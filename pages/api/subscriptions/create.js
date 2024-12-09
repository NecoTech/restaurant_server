import dbConnect from '../../../lib/dbConnect';
import Subscription from '../../../models/Subscription';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            await Subscription.findOneAndUpdate(
                { userId: req.admin._id, status: 'active' },
                { status: 'cancelled' }
            );

            const subscription = await Subscription.create({
                ...req.body,
                userId: req.admin._id
            });

            res.status(201).json(subscription);
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create subscription' });
    }
}

export default withCors(handler);