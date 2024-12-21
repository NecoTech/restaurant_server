import dbConnect from '../../../../lib/dbConnect';
import OtherBill from '../../../../models/OtherBill';
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
            const { paymentStatus, paymentMethod } = req.body;

            if (!paymentStatus || !['PENDING', 'PARTIAL', 'PAID'].includes(paymentStatus)) {
                return res.status(400).json({
                    error: 'Invalid payment status'
                });
            }

            try {
                const bill = await OtherBill.findByIdAndUpdate(
                    id,
                    {
                        paymentStatus,
                        paymentMethod,
                        updatedAt: new Date()
                    },
                    { new: true, runValidators: true }
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
        });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
}

export default withCors(handler);