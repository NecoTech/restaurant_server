import dbConnect from '../../../../lib/dbConnect';
import MenuItem from '../../../../models/MenuItem';
import { protect } from '../../../../middleware/authMiddleware';
import { withCors } from '../../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { id } = req.query;  // This comes from the URL parameter
            const {
                name,
                description,
                price,
                isAvailable,
                image,
                volume,
                restaurantId,
                category,
                margin
            } = req.body;

            // Validate required fields
            if (!name || !price || !restaurantId || !category) {
                return res.status(400).json({
                    error: 'Please provide all required fields'
                });
            }

            try {
                // Find the menu category
                const menuCategory = await MenuItem.findOne({
                    id: restaurantId,
                    category: category
                });

                if (!menuCategory) {
                    return res.status(404).json({
                        error: 'Menu category not found'
                    });
                }

                // Find and update the specific item in the items array
                const itemIndex = menuCategory.items.findIndex(
                    item => item._id.toString() === id
                );

                if (itemIndex === -1) {
                    return res.status(404).json({
                        error: 'Item not found in this category'
                    });
                }

                // Update the item
                menuCategory.items[itemIndex] = {
                    ...menuCategory.items[itemIndex],
                    name,
                    description,
                    price: parseFloat(price),
                    isAvailable,
                    image,
                    volume,
                    margin: parseFloat(margin),
                    updatedAt: new Date()
                };

                // Save the updated document
                await menuCategory.save();

                // Return the updated item
                res.status(200).json({
                    message: 'Menu item updated successfully',
                    item: menuCategory.items[itemIndex]
                });

            } catch (error) {
                if (error.name === 'ValidationError') {
                    return res.status(400).json({
                        error: 'Validation error',
                        details: Object.values(error.errors).map(err => err.message)
                    });
                }
                throw error;
            }
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
}

export default withCors(handler);