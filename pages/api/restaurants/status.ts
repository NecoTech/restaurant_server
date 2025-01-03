import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import { withCors } from '@/lib/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    await dbConnect();

    if (method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    try {
        const { id, isOnline } = req.body;

        // Validate required fields
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        if (typeof isOnline !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isOnline must be a boolean value'
            });
        }

        // Update the restaurant using the id field directly
        const updatedRestaurant = await Restaurant.findOneAndUpdate(
            { id: id }, // Use the schema's id field
            { isOnline },
            { new: true }
        );

        if (!updatedRestaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: `Restaurant is now ${isOnline ? 'online' : 'offline'}`,
            data: updatedRestaurant
        });

    } catch (error) {
        console.error('Error updating restaurant status:', error);

        res.status(500).json({
            success: false,
            message: 'Error updating restaurant status'
        });
    }
}

export default withCors(handler);