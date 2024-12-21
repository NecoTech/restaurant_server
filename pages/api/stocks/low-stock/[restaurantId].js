import dbConnect from '../../../../lib/dbConnect';
import Stock from '../../../../models/Stock';
import { protect } from '../../../../middleware/authMiddleware';
import { withCors } from '../../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { restaurantId } = req.query;

            const lowStockItems = await Stock.find({
                restaurantId,
                $expr: {
                    $lte: ['$quantity', '$minQuantity']
                }
            });

            res.status(200).json(lowStockItems);
        });
    } catch (error) {
        console.error('Low stock check error:', error);
        res.status(500).json({ error: 'Failed to check low stock items' });
    }
}

export default withCors(handler);