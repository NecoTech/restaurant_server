import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import Admin from '../../../models/Admin';
import { withCors } from '../../../lib/cors';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await dbConnect();

        const { email, password, name } = req.body;

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Create new admin
        const admin = new Admin({
            email,
            password,
            name
        });

        await admin.save();

        res.status(201).json({ success: true, message: 'Admin account created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Error creating admin account' });
    }
}

export default withCors(handler);