import dbConnect from '../../../lib/dbConnect';
import Stock from '../../../models/Stock';
// import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const {
        query: { params },
        method,
        body
    } = req;

    try {
        // await protect(req, res, async () => {
        await dbConnect();

        // Handle GET request for fetching stock items by restaurantId
        // GET /api/stock/:restaurantId
        if (method === 'GET' && params.length === 1) {
            try {
                const restaurantId = params[0];
                const stocks = await Stock.find({ restaurantId })
                    .sort({ lastUpdated: -1 });
                return res.status(200).json(stocks);
            } catch (error) {
                console.error('Error fetching stocks:', error);
                return res.status(400).json({ error: error.message });
            }
        }

        // Handle PATCH request for updating stock quantity
        // PATCH /api/stock/:stockId/update
        if (method === 'PATCH' && params.length === 2 && params[1] === 'update') {
            try {
                const stockId = params[0];

                // Validate input
                if (body.quantity < 0) {
                    return res.status(400).json({
                        error: 'Stock quantity cannot be negative'
                    });
                }

                const updatedStock = await Stock.findByIdAndUpdate(
                    stockId,
                    {
                        quantity: body.quantity,
                        lastUpdated: body.lastUpdated || new Date().toISOString()
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                if (!updatedStock) {
                    return res.status(404).json({ error: 'Stock item not found' });
                }

                // Check if stock is below minimum quantity
                if (updatedStock.quantity <= updatedStock.minQuantity) {
                    console.log(`Low stock alert for ${updatedStock.name}`);
                    // You could add notification logic here
                }

                return res.status(200).json(updatedStock);
            } catch (error) {
                if (error.name === 'ValidationError') {
                    return res.status(400).json({
                        error: 'Validation error',
                        details: Object.values(error.errors).map(err => err.message)
                    });
                }
                throw error;
            }
        }

        // If no route matches
        res.setHeader('Allow', ['GET', 'PATCH']);
        return res.status(405).end(`Method ${method} Not Allowed`);
        // });
    } catch (error) {
        console.error('Stock API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default withCors(handler);