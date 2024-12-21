import dbConnect from '../../../lib/dbConnect';
import Stock from '../../../models/Stock';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const {
        query: { id },
        method
    } = req;

    try {
        await protect(req, res, async () => {
            await dbConnect();

            switch (method) {
                case 'GET':
                    try {
                        const stock = await Stock.findById(id);
                        if (!stock) {
                            return res.status(404).json({ error: 'Stock not found' });
                        }
                        res.status(200).json(stock);
                    } catch (error) {
                        res.status(400).json({ error: error.message });
                    }
                    break;

                case 'PUT':
                    try {
                        const stock = await Stock.findByIdAndUpdate(
                            id,
                            { ...req.body, updatedAt: new Date() },
                            {
                                new: true,
                                runValidators: true
                            }
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
                    break;

                case 'DELETE':
                    try {
                        const deletedStock = await Stock.findByIdAndDelete(id);
                        if (!deletedStock) {
                            return res.status(404).json({ error: 'Stock not found' });
                        }
                        res.status(200).json({ message: 'Stock deleted successfully' });
                    } catch (error) {
                        res.status(400).json({ error: error.message });
                    }
                    break;

                default:
                    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
                    res.status(405).end(`Method ${method} Not Allowed`);
            }
        });
    } catch (error) {
        console.error('Stock API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withCors(handler);