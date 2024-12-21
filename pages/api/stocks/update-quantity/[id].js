import dbConnect from '../../../../lib/dbConnect';
import Stock from '../../../../models/Stock';
import { protect } from '../../../../middleware/authMiddleware';
import { withCors } from '../../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { id } = req.query;
            const { quantity } = req.body;

            if (typeof quantity !== 'number' || quantity < 0) {
                return res.status(400).json({
                    error: 'Invalid quantity value'
                });
            }

            try {
                const stock = await Stock.findByIdAndUpdate(
                    id,
                    {
                        quantity,
                        updatedAt: new Date(),
                        isAvailable: quantity > 0
                    },
                    { new: true, runValidators: true }
                );

                if (!stock) {
                    return res.status(404).json({ error: 'Stock not found' });
                }

                res.status(200).json(stock);
            } catch (error) {
                if (error.name === 'ValidationError') {
                    return res.status(400).json({
                        error: 'Validation error',
                        details: Object.values(error.errors).map(err => err.message)
                    });
                }
                throw error;
            }
        });
    } catch (error) {
        console.error('Update stock quantity error:', error);
        res.status(500).json({ error: 'Failed to update stock quantity' });
    }
}

export default withCors(handler);