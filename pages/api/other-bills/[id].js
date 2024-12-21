import dbConnect from '../../../lib/dbConnect';
import OtherBill from '../../../models/OtherBill';
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
                        const bill = await OtherBill.findById(id);
                        if (!bill) {
                            return res.status(404).json({ error: 'Bill not found' });
                        }
                        res.status(200).json(bill);
                    } catch (error) {
                        res.status(400).json({ error: error.message });
                    }
                    break;

                case 'PUT':
                    try {
                        // Validate required fields
                        const { billType, billNumber, amount, billDate, dueDate } = req.body;

                        if (!billType || !billNumber || !amount || !billDate || !dueDate) {
                            return res.status(400).json({
                                error: 'Missing required fields'
                            });
                        }

                        const bill = await OtherBill.findByIdAndUpdate(
                            id,
                            { ...req.body, updatedAt: new Date() },
                            {
                                new: true,
                                runValidators: true
                            }
                        );

                        if (!bill) {
                            return res.status(404).json({ error: 'Bill not found' });
                        }

                        res.status(200).json(bill);
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
                        const deletedBill = await OtherBill.findByIdAndDelete(id);
                        if (!deletedBill) {
                            return res.status(404).json({ error: 'Bill not found' });
                        }
                        res.status(200).json({ message: 'Bill deleted successfully' });
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
        console.error('Other Bills API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withCors(handler);