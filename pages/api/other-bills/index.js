import dbConnect from '../../../lib/dbConnect';
import OtherBill from '../../../models/OtherBill';
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

                        const bills = await OtherBill.find({
                            restaurantId: restaurantId.toString()
                        }).sort({ billDate: -1 });

                        res.status(200).json(bills);
                    } catch (error) {
                        res.status(400).json({ error: error.message });
                    }
                    break;

                case 'POST':
                    try {
                        // Validate required fields
                        const { billType, billNumber, amount, billDate, dueDate, restaurantId } = req.body;

                        if (!billType || !billNumber || !amount || !billDate || !dueDate || !restaurantId) {
                            return res.status(400).json({
                                error: 'Missing required fields'
                            });
                        }

                        const bill = await OtherBill.create({
                            ...req.body,
                            restaurantId: req.body.restaurantId.toString()
                        });
                        res.status(201).json(bill);
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
        console.error('Other Bills API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withCors(handler);