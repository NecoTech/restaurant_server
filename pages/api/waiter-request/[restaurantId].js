import dbConnect from '..//..//..//lib/dbConnect';
import WaiterAssistance from '..//..//..//models/WaiterAssistance';
import { withCors } from '..//..//../lib/cors';

async function handler(req, res) {
    const {
        query: { restaurantId },
        method,
    } = req;

    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                // Validate restaurantId
                if (!restaurantId) {
                    return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
                }

                // Fetch waiter assistance requests for the specified restaurant
                // You might want to limit this to recent requests or add pagination
                const waiterAssistanceRequests = await WaiterAssistance.find({
                    restaurantId: restaurantId,
                    status: { $ne: 'completed' } // Optionally, exclude completed requests
                }).sort({ createdAt: -1 }); // Sort by creation time, newest first

                res.status(200).json(waiterAssistanceRequests);
            } catch (error) {
                console.error('Error fetching waiter assistance requests:', error);
                res.status(500).json({ success: false, message: 'An error occurred while fetching waiter assistance requests' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);