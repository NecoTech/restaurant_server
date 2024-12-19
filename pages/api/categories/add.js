import dbConnect from '../../../lib/dbConnect';
import MenuItem from '../../../models/MenuItem';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            await dbConnect();

            const { name, restaurantId } = req.body;

            if (!name || !restaurantId) {
                return res.status(400).json({
                    error: 'Category name and restaurant ID are required'
                });
            }




            // Check if category already exists
            const existingCategory = await MenuItem.findOne({
                id: restaurantId,
                category: name
            });

            if (existingCategory) {
                return res.status(400).json({
                    error: 'Category already exists for this restaurant'
                });
            }

            // Create a new menu item with the category
            const newMenuItem = await MenuItem.create({
                id: restaurantId,
                name: `${name.trim()} Default Item`,
                description: `Default item for ${name.trim()} category`,
                price: 0,
                category: name,
                image: '',
                isAvailable: false
            });

            // Get updated list of all unique categories
            const categories = await MenuItem.distinct('category', {
                id: restaurantId
            });

            res.status(201).json({
                message: 'Category added successfully',
                category: name,
                menuItem: newMenuItem,
                image: '',
                allCategories: categories
            });
        });
    } catch (error) {
        console.error('Category creation error:', error);
        res.status(500).json({
            error: error.message || 'Failed to create category'
        });
    }
}

export default withCors(handler);