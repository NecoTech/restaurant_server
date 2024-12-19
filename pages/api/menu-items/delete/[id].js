import dbConnect from '../../../../lib/dbConnect';
import MenuItem from '../../../../models/MenuItem';
import { protect } from '../../../../middleware/authMiddleware';
import { withCors } from '../../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { id } = req.query; // Get the item ID from the URL

            try {
                // Find the menu category containing the item
                const menuCategory = await MenuItem.findOne({
                    "items._id": id
                });

                if (!menuCategory) {
                    return res.status(404).json({
                        error: 'Item not found'
                    });
                }

                // Remove the item from the items array
                menuCategory.items = menuCategory.items.filter(
                    item => item._id.toString() !== id
                );

                // If no items left in category, delete the whole category
                if (menuCategory.items.length === 0) {
                    await MenuItem.deleteOne({ _id: menuCategory._id });
                    return res.status(200).json({
                        message: 'Category deleted as it had no items',
                        isEmptyCategory: true
                    });
                }

                // Save the updated document
                await menuCategory.save();

                res.status(200).json({
                    message: 'Menu item deleted successfully'
                });

            } catch (error) {
                console.error('Error finding/updating document:', error);
                throw error;
            }
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
}

export default withCors(handler);