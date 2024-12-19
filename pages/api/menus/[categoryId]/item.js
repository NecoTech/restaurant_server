import dbConnect from '..//..//..//..//lib/dbConnect';
import MenuItem from '..//..//..//..//models/MenuItem';
import { withCors } from '..//..//..//..//lib/cors';

async function handler(req, res) {
    const { method } = req;
    const { categoryId } = req.query;
    await dbConnect();

    switch (method) {
        case 'PATCH':
            try {
                const { itemName, isAvailable } = req.body;

                // Validate required fields
                if (!itemName || typeof isAvailable !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields or invalid isAvailable value'
                    });
                }

                // Find the category document
                const menuCategory = await MenuItem.findById(categoryId);
                if (!menuCategory) {
                    return res.status(404).json({
                        success: false,
                        message: 'Menu category not found'
                    });
                }

                // Find the item within the category's items array
                const itemIndex = menuCategory.items.findIndex(item => item.name === itemName);
                if (itemIndex === -1) {
                    return res.status(404).json({
                        success: false,
                        message: 'Item not found in category'
                    });
                }

                // Update the specific item's availability
                const updateResult = await MenuItem.findOneAndUpdate(
                    {
                        _id: categoryId,
                        'items.name': itemName
                    },
                    {
                        $set: {
                            'items.$.isAvailable': isAvailable
                        }
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

                if (!updateResult) {
                    return res.status(404).json({
                        success: false,
                        message: 'Update failed'
                    });
                }

                // Return the updated item
                const updatedItem = updateResult.items.find(item => item.name === itemName);
                res.status(200).json({
                    success: true,
                    data: updatedItem
                });

            } catch (error) {
                console.error('Error in PATCH operation:', error);
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            break;

        case 'GET':
            try {
                const itemName = decodeURIComponent(req.query.itemName || '');

                // Validate required parameters
                if (!categoryId || !itemName) {
                    return res.status(400).json({
                        success: false,
                        message: 'Both categoryId and itemName are required'
                    });
                }

                // Find the category document and populate necessary fields
                const menuCategory = await MenuItem.findById(categoryId)
                    .select('category items')
                    .lean();

                if (!menuCategory) {
                    return res.status(404).json({
                        success: false,
                        message: 'Menu category not found'
                    });
                }

                // Find the specific item in the category's items array
                const item = menuCategory.items.find(item => item.name === itemName);

                if (!item) {
                    return res.status(404).json({
                        success: false,
                        message: 'Item not found in category'
                    });
                }

                // Send response with both item data and category information
                res.status(200).json({
                    success: true,
                    data: {
                        ...item,
                        categoryId: menuCategory._id // Include categoryId in response
                    },
                    category: menuCategory.category,
                    categoryId: menuCategory._id
                });

            } catch (error) {
                console.error('Error in GET operation:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server error while fetching item details'
                });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'PATCH']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);