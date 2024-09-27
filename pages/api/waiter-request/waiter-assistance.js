import dbConnect from '..//..//..//lib/dbConnect';
import WaiterAssistance from '..//..//..//models/WaiterAssistance';
import { withCors } from '..//..//../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    switch (method) {
        case 'POST':
            try {
                const { restaurantId, reason, tableNumber } = req.body;

                // Validate the input
                if (!restaurantId || !reason) {
                    return res.status(400).json({ success: false, message: 'restaurantId and reason are required' });
                }

                // Create a new waiter assistance request
                const waiterAssistance = new WaiterAssistance({
                    restaurantId,
                    reason,
                    tableNumber,
                    status: 'pending', // You can use this to track the status of the request
                    createdAt: new Date()
                });

                // Save the request to the database
                await waiterAssistance.save();

                // TODO: Implement notification system here (e.g., WebSocket, push notification)
                // This is where you would send a real-time notification to the restaurant staff

                res.status(201).json({ success: true, message: 'Waiter assistance request created successfully' });
            } catch (error) {
                console.error('Error in waiter assistance API:', error);
                res.status(500).json({ success: false, message: 'An error occurred while processing your request' });
            }
            break;

        default:
            res.setHeader('Allow', ['POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);