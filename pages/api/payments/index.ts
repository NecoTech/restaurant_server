import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import { withCors } from '@/lib/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const { restaurantId, paymentMethod, ownerEmail } = query;

                if (!ownerEmail) {
                    return res.status(400).json({ message: 'Owner email is required' });
                }

                // First, get all restaurants owned by this owner
                const ownerRestaurants = await Restaurant.find({ ownerEmail });
                const restaurantIds = ownerRestaurants.map(restaurant => restaurant.id);

                // Build query based on filters
                const queryObj: any = {
                    restaurantId: { $in: restaurantIds },
                    orderStatus: 'Completed' // Only get orders from owner's restaurants
                };

                // Add specific restaurant filter if provided
                if (restaurantId && restaurantId !== 'all') {
                    queryObj.restaurantId = restaurantId;
                }

                // Add payment method filter if provided
                if (paymentMethod && paymentMethod !== 'all') {
                    queryObj.paymentMethod = paymentMethod;
                }

                const orders = await Order.find(queryObj, { orderStatus: 'Completed' })
                    .sort({ createdAt: -1 })
                    .select('userId orderNumber total phonenumber orderStatus paymentMethod paid restaurantId createdAt');

                // Add restaurant details to each order
                const restaurantsMap = ownerRestaurants.reduce((map, restaurant) => {
                    map[restaurant.id] = restaurant.name;
                    return map;
                }, {} as { [key: string]: string });

                const ordersWithRestaurantDetails = orders.map(order => ({
                    ...order.toObject(),
                    restaurantName: restaurantsMap[order.restaurantId] || 'Unknown Restaurant'
                }));

                res.status(200).json(ordersWithRestaurantDetails);
            } catch (error) {
                console.error('Error fetching payments:', error);
                res.status(500).json({ message: 'Error fetching payments' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);