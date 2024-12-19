import dbConnect from '../../../../../lib/dbConnect';
import MenuItem from '../../../../../models/MenuItem';
import { protect } from '../../../../../middleware/authMiddleware';
import { withCors } from '../../../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { restaurantId, category } = req.query; // Get restaurantId and category from URL

            if (!restaurantId || !category) {
                return res.status(400).json({
                    error: 'Restaurant ID and category are required'
                });
            }

            try {
                // Find the menu category
                const menuCategory = await MenuItem.findOne({
                    id: restaurantId,
                    category: decodeURIComponent(category)
                });

                if (!menuCategory) {
                    return res.status(404).json({
                        error: 'Category not found'
                    });
                }

                // Check if category has items
                if (menuCategory.items && menuCategory.items.length > 0) {
                    return res.status(400).json({
                        error: 'Cannot delete category with items. Please delete all items first.'
                    });
                }

                // Delete the category
                await MenuItem.deleteOne({
                    id: restaurantId,
                    category: decodeURIComponent(category)
                });

                res.status(200).json({
                    message: 'Category deleted successfully'
                });

            } catch (error) {
                console.error('Error finding/deleting category:', error);
                throw error;
            }
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}

export default withCors(handler);