import dbConnect from '../../../lib/dbConnect';
import Admin from '../../../models/Admin';
import jwt from 'jsonwebtoken';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    if (method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

export default withCors(handler);
