import dbConnect from '../../../../lib/dbConnect';
import Restaurant from '../../../../models/Restaurant';
import { withCors } from '../../../../lib/cors';

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
                    return res.status(400).json({
                        success: false,
                        message: 'Restaurant ID is required'
                    });
                }

                // Fetch restaurant details
                const restaurant = await Restaurant.findOne(
                    { id: restaurantId },
                    { ownerEmail: 1, name: 1 } // Only fetch ownerEmail and name fields
                );

                if (!restaurant) {
                    return res.status(404).json({
                        success: false,
                        message: 'Restaurant not found'
                    });
                }

                res.status(200).json({
                    success: true,
                    ownerEmail: restaurant.ownerEmail,
                    name: restaurant.name
                });
            } catch (error) {
                console.error('Error fetching restaurant details:', error);
                res.status(500).json({
                    success: false,
                    message: 'An error occurred while fetching restaurant details'
                });
            }
            break;

        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);