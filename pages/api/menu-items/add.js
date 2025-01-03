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

            const {
                restaurantId,
                category,
                name,
                description,
                price,
                volume,
                image,
                // isHidden,
                isOutOfStock,
                margin
            } = req.body;

            // Validate required fields
            if (!restaurantId || !category || !name || !price) {
                return res.status(400).json({
                    error: 'Please provide all required fields'
                });
            }

            try {
                // Find existing menu category or create new one
                let menuCategory = await MenuItem.findOne({
                    id: restaurantId,
                    category: category
                });

                const newItem = {
                    name,
                    description,
                    price: parseFloat(price),
                    isAvailable: !isOutOfStock,
                    image,
                    volume: volume ? volume : undefined,
                    margin: parseFloat(margin)
                    // isHidden: isHidden || false
                };

                if (menuCategory) {
                    // Add new item to existing category
                    menuCategory.items.push(newItem);
                    await menuCategory.save();
                } else {
                    // Create new category with item
                    menuCategory = await MenuItem.create({
                        id: restaurantId,
                        category,
                        items: [newItem]
                    });
                }

                res.status(201).json({
                    message: 'Menu item added successfully',
                    category: menuCategory
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
        console.error('Add menu item error:', error);
        res.status(500).json({ error: 'Failed to add menu item' });
    }
}

export default withCors(handler);