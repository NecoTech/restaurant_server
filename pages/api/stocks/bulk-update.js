import dbConnect from '../../../lib/dbConnect';
import Stock from '../../../models/Stock';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { restaurantId, items } = req.body;

            if (!restaurantId || !items || !Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid request data' });
            }

            const bulkOps = items.map(item => ({
                updateOne: {
                    filter: {
                        restaurantId,
                        'name': item.name
                    },
                    update: {
                        $inc: { 'quantity': item.quantity },
                        $set: {
                            'price': item.price,
                            'unit': item.unit,
                            'isAvailable': true
                        }
                    },
                    upsert: true
                }
            }));

            await Stock.bulkWrite(bulkOps);

            res.status(200).json({
                success: true,
                message: 'Stock updated successfully'
            });
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
}

export default withCors(handler);