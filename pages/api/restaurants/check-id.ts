import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { withCors } from '@/lib/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query } = req;
    await dbConnect();

    if (method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    try {
        const { id } = query;
        const existingRestaurant = await Restaurant.findOne({ id });

        res.status(200).json({
            exists: !!existingRestaurant
        });
    } catch (error) {
        console.error('Error checking restaurant ID:', error);
        res.status(500).json({ success: false, message: 'Error checking restaurant ID' });
    }
}

export default withCors(handler);