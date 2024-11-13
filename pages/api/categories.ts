import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import { withCors } from '@/lib/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const { restaurantId } = query;

                if (!restaurantId) {
                    return res.status(400).json({ message: 'Restaurant ID is required' });
                }

                // Get unique categories for the restaurant
                const categories = await MenuItem.distinct('category', { id: restaurantId });
                res.status(200).json(categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                res.status(500).json({ message: 'Error fetching categories' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);