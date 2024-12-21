import dbConnect from '../../../lib/dbConnect';
import Stock from '../../../models/Stock';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;

    try {
        await protect(req, res, async () => {
            await dbConnect();

            switch (method) {
                case 'GET':
                    try {
                        const { restaurantId } = req.query;
                        if (!restaurantId) {
                            return res.status(400).json({ error: 'Restaurant ID is required' });
                        }

                        // Using string comparison for restaurantId
                        const stocks = await Stock.find({
                            restaurantId: restaurantId.toString()
                        }).sort({ createdAt: -1 });

                        res.status(200).json(stocks);
                    } catch (error) {
                        res.status(400).json({ error: error.message });
                    }
                    break;

                case 'POST':
                    try {
                        // Ensure restaurantId is stored as string
                        const stockData = {
                            ...req.body,
                            restaurantId: req.body.restaurantId.toString()
                        };
                        const stock = await Stock.create(stockData);
                        res.status(201).json(stock);
                    } catch (error) {
                        if (error.name === 'ValidationError') {
                            return res.status(400).json({
                                error: 'Validation error',
                                details: Object.values(error.errors).map(err => err.message)
                            });
                        }
                        throw error;
                    }
                    break;

                default:
                    res.setHeader('Allow', ['GET', 'POST']);
                    res.status(405).end(`Method ${method} Not Allowed`);
            }
        });
    } catch (error) {
        console.error('Stock API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withCors(handler);