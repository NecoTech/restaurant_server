import dbConnect from '../../../lib/dbConnect';
import PurchaseBill from '../../../models/PurchaseBill';
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
                        const { restaurantId, startDate, endDate } = req.query;
                        if (!restaurantId) {
                            return res.status(400).json({ error: 'Restaurant ID is required' });
                        }

                        // Build the query object
                        let query = {
                            restaurantId: restaurantId.toString()
                        };

                        // Add date range filters if provided
                        if (startDate || endDate) {
                            query.billDate = {};

                            if (startDate) {
                                query.billDate.$gte = new Date(startDate);
                            }

                            if (endDate) {
                                // Add one day to endDate to include the entire day
                                const endDateObj = new Date(endDate);
                                endDateObj.setDate(endDateObj.getDate() + 1);
                                query.billDate.$lt = endDateObj;
                            }
                        }

                        const bills = await PurchaseBill.find(query)
                            .sort({ billDate: -1 });

                        res.status(200).json(bills);
                    } catch (error) {
                        console.error('GET bills error:', error);
                        res.status(400).json({ error: error.message });
                    }
                    break;

                case 'POST':
                    try {
                        const billData = {
                            ...req.body,
                            restaurantId: req.body.restaurantId.toString()
                        };

                        // Validate items
                        if (!billData.items || billData.items.length === 0) {
                            return res.status(400).json({
                                error: 'At least one item is required'
                            });
                        }

                        const bill = await PurchaseBill.create(billData);
                        res.status(201).json(bill);
                    } catch (error) {
                        if (error.name === 'ValidationError') {
                            return res.status(400).json({
                                error: 'Validation error',
                                details: Object.values(error.errors).map(err => err.message)
                            });
                        }
                        console.error('POST bill error:', error);
                        throw error;
                    }
                    break;

                default:
                    res.setHeader('Allow', ['GET', 'POST']);
                    res.status(405).end(`Method ${method} Not Allowed`);
            }
        });
    } catch (error) {
        console.error('Purchase Bill API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withCors(handler);