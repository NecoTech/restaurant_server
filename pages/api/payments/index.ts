import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import Restaurant from '@/models/Restaurant';
import { withCors } from '@/lib/cors';
import { FilterQuery } from 'mongoose';

interface IOrder {
    userId: string;
    orderNumber: string;
    total: number;
    phonenumber: string;
    orderStatus: 'Pending' | 'Completed' | 'Cancelled';
    paymentMethod: string;
    paid: boolean;
    restaurantId: string;
    createdAt: Date;
}

interface QueryParams {
    restaurantId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
}

const buildOrderQuery = (restaurantIds: string[], params: QueryParams): FilterQuery<IOrder> => {
    const startDate = params.startDate ? new Date(params.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    return {
        restaurantId: params.restaurantId && params.restaurantId !== 'all'
            ? params.restaurantId
            : { $in: restaurantIds },
        orderStatus: 'Completed',
        createdAt: {
            $gte: startDate,
            $lte: endDate
        },
        ...(params.paymentMethod && params.paymentMethod !== 'all' && {
            paymentMethod: params.paymentMethod
        })
    };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const {
                    restaurantId,
                    paymentMethod,
                    ownerEmail,
                    startDate,
                    endDate
                } = query;

                if (!ownerEmail) {
                    return res.status(400).json({ message: 'Owner email is required' });
                }

                const ownerRestaurants = await Restaurant.find({ ownerEmail });
                const restaurantIds = ownerRestaurants.map(restaurant => restaurant.id);

                const orderQuery = buildOrderQuery(restaurantIds, {
                    restaurantId: restaurantId as string,
                    paymentMethod: paymentMethod as string,
                    startDate: startDate as string,
                    endDate: endDate as string
                });

                const orders = await Order.find(orderQuery)
                    .sort({ createdAt: -1 })
                    .select('userId orderNumber total phonenumber orderStatus paymentMethod paid restaurantId createdAt');

                const restaurantsMap: Record<string, string> = ownerRestaurants.reduce(
                    (map, restaurant) => ({
                        ...map,
                        [restaurant.id]: restaurant.name
                    }),
                    {}
                );

                const ordersWithRestaurantDetails = orders.map(order => ({
                    ...order.toObject(),
                    restaurantName: restaurantsMap[order.restaurantId] ?? 'Unknown Restaurant'
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