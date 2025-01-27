import dbConnect from '..//..//../lib/dbConnect';
import Order from '..//..//../models/Order';
import Restaurant from '..//..//..//models/Restaurant';
import { withCors } from '..//..//../lib/cors';

const buildOrderQuery = async (restaurantIds, params, ownerEmail) => {
    const startDate = params.startDate ? new Date(params.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Get restaurants with their types
    const restaurants = await Restaurant.find({ ownerEmail });
    const canteenIds = restaurants
        .filter(r => r.restaurantType === 'Canteen')
        .map(r => r.id);
    const nonCanteenIds = restaurants
        .filter(r => r.restaurantType !== 'Canteen')
        .map(r => r.id);

    console.log(canteenIds, nonCanteenIds)


    return {
        $or: [
            // Canteen restaurants: show NotComplete and unpaid orders
            {
                restaurantId: { $in: canteenIds },
                orderStatus: { $in: ['Notcomplete', 'Completed'] },
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            },
            // Non-canteen restaurants: show Completed orders
            {
                restaurantId: { $in: nonCanteenIds },
                orderStatus: 'Completed',
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        ]
    };
};

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const {
                    ownerEmail,
                    startDate,
                    endDate
                } = query;

                if (!ownerEmail) {
                    return res.status(400).json({ message: 'Owner email is required' });
                }

                const ownerRestaurants = await Restaurant.find({ ownerEmail });
                const restaurantIds = ownerRestaurants.map(restaurant => restaurant.id);

                const orderQuery = await buildOrderQuery(restaurantIds, {
                    startDate,
                    endDate
                }, ownerEmail);

                const orders = await Order.find(orderQuery)
                    .sort({ createdAt: -1 })
                    .select('userId orderNumber total phonenumber orderStatus paymentMethod paid restaurantId createdAt');



                // Create map with both name and type
                const restaurantsMap = ownerRestaurants.reduce(
                    (map, restaurant) => ({
                        ...map,
                        [restaurant.id]: {
                            name: restaurant.name,
                            type: restaurant.restaurantType
                        }
                    }),
                    {}
                );




                const ordersWithRestaurantDetails = orders.map(order => ({
                    ...order.toObject(),
                    restaurantName: restaurantsMap[order.restaurantId]?.name ?? 'Unknown Restaurant',
                    restaurantType: restaurantsMap[order.restaurantId]?.type
                }));
                console.log(ordersWithRestaurantDetails)

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