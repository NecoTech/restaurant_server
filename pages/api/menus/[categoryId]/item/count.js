import dbConnect from '../../../../../lib/dbConnect';
import MenuItem from '../../../../../models/MenuItem';
import { withCors } from '../../../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    const { categoryId } = req.query;
    await dbConnect();

    if (method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    try {
        const { itemName, count, updateAvailability, isAvailable } = req.body;

        // Validate required fields
        if (!itemName || typeof count !== 'number' || count < 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields or invalid count value'
            });
        }

        // Prepare update object
        const updateObj = {
            'items.$.count': count
        };

        // If updating availability, add it to the update object
        if (updateAvailability) {
            updateObj['items.$.isAvailable'] = isAvailable;
        }

        // Find and update the item
        const updateResult = await MenuItem.findOneAndUpdate(
            {
                _id: categoryId,
                'items.name': itemName
            },
            {
                $set: updateObj
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updateResult) {
            return res.status(404).json({
                success: false,
                message: 'Item not found or update failed'
            });
        }

        // Find the updated item in the items array
        const updatedItem = updateResult.items.find(item => item.name === itemName);

        res.status(200).json({
            success: true,
            data: updatedItem
        });

    } catch (error) {
        console.error('Error updating item count:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export default withCors(handler);