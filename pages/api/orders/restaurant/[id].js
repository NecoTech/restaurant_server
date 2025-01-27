import dbConnect from '../../../../lib/dbConnect';
import Order from '../../../../models/Order';
import Restaurant from '../../../../models/Restaurant';
import { withCors } from '..//..//..//..//lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const { id, startDate, endDate } = query;

                // First, get restaurant type
                const restaurant = await Restaurant.findOne({ id: id });
                if (!restaurant) {
                    return res.status(404).json({ message: 'Restaurant not found' });
                }



                // Build date range query
                const dateQuery = {};
                if (startDate && endDate) {
                    dateQuery.createdAt = {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    };
                }

                // Build base query conditions
                let queryConditions = {
                    restaurantId: id,
                    ...dateQuery
                };

                // Add conditions based on restaurant type
                if (restaurant.restaurantType === 'Canteen') {
                    queryConditions = {
                        ...queryConditions,
                        orderStatus: 'Notcomplete',
                        paid: true
                    };
                } else {
                    queryConditions = {
                        ...queryConditions,
                        orderStatus: {
                            $nin: ['Completed', 'Cancelled']
                        }
                    };
                }
                const orders = await Order.find(queryConditions)
                    .sort({ createdAt: -1 }) // Changed to descending order (newest first)

                res.status(200).json(orders);

            } catch (error) {
                console.error('Error in orders API:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
            break;

        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);