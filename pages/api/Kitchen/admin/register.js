import dbConnect from '../../../../lib/dbConnect';
import KitchenAdmin from '../../../../models/KitchenAdmin';
import { withCors } from '../../../../lib/cors';

async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    if (method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { name, email, password, restaurantId } = req.body;

        // Validate input
        if (!name || !email || !password || !restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if email already exists
        const existingAdmin = await KitchenAdmin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new admin
        const admin = await KitchenAdmin.create({
            name,
            email,
            password, // Password will be hashed in the model's pre-save hook
            restaurantId
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                restaurantId: admin.restaurantId
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

export default withCors(handler);