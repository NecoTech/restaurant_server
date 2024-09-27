import dbConnect from '..//..//..//..//lib/dbConnect';
import MenuItem from '..//..//..//..//models/MenuItem';
import { withCors } from '..//..//..//..//lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const item = await MenuItem.findById(query.itemid);
                if (!item) {
                    return res.status(404).json({ message: 'item not found' });
                }
                res.status(200).json(item);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
            break;
        case 'PATCH':
            try {
                const { isAvailable } = req.body;

                if (typeof isAvailable !== 'boolean') {
                    return res.status(400).json({ success: false, message: 'Invalid isAvailable value' });
                }

                // Fetch the current document
                const currentMenuItem = await MenuItem.findById(query.itemid);
                if (!currentMenuItem) {
                    return res.status(404).json({ success: false, message: 'Menu item not found' });
                }

                // Perform the update
                const updatedMenuItem = await MenuItem.findByIdAndUpdate(
                    query.itemid,
                    { $set: { isAvailable: isAvailable } },
                    { new: true, runValidators: true }
                );

                if (!updatedMenuItem) {
                    return res.status(404).json({ success: false, message: 'Update failed' });
                }

                res.status(200).json({ success: true, data: updatedMenuItem });
            } catch (error) {
                console.error('Error in PATCH operation:', error);
                res.status(400).json({ success: false, message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['GET', 'PATCH']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);