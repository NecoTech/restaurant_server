import dbConnect from '../../../lib/dbConnect';
import Feedback from '../../../models/Feedback';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const feedback = await Feedback.create({
                subject: req.body.subject,
                message: req.body.message,
                userId: req.admin._id,
                email: req.body.email,
                status: 'pending', // pending, reviewed, resolved
                createdAt: new Date()
            });

            res.status(201).json(feedback);
        });
    } catch (error) {
        console.error('Feedback creation error:', error);
        res.status(500).json({ error: 'Failed to create feedback' });
    }
}

export default withCors(handler);