import dbConnect from '../../../lib/dbConnect';
import Admin from '../../../models/Admin';
import { protect } from '../../../middleware/authMiddleware';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            await protect(req, res, async () => {
                await dbConnect();

                // Find admin by email if provided, otherwise use ID
                const query = req.query.email
                    ? { email: req.query.email }
                    : { _id: req.admin._id };

                const admin = await Admin.findOne(query).select('-password');
                if (!admin) {
                    return res.status(404).json({ error: 'Admin not found' });
                }

                res.status(200).json(admin);
            });
        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    } else if (req.method === 'PUT') {
        try {
            await protect(req, res, async () => {
                await dbConnect();

                const updatedAdmin = await Admin.findByIdAndUpdate(
                    req.admin._id,
                    {
                        name: req.body.name,
                        phone: req.body.phone,
                        gender: req.body.gender,
                        dateOfBirth: req.body.dateOfBirth,
                        profileImage: req.body.profileImage
                    },
                    { new: true, runValidators: true }
                ).select('-password');

                res.status(200).json(updatedAdmin);
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

export default withCors(handler);