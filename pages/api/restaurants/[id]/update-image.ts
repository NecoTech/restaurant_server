import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import Restaurant from '@/models/Restaurant';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
    api: {
        bodyParser: false,
    },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;
    await dbConnect();

    if (method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    try {
        const form = formidable({
            keepExtensions: true,
            maxFileSize: 15 * 1024 * 1024, // 10MB
        });

        // Parse the form data
        const files = await new Promise<formidable.Files>((resolve, reject) => {
            form.parse(req, (err, _fields, files) => {
                if (err) reject(err);
                resolve(files);
            });
        });

        const imageFile = files.image?.[0];
        if (!imageFile) {
            throw new Error('No image file uploaded');
        }

        // Read the file data
        const imageData = await fs.readFile(imageFile.filepath);

        // Update the restaurant image
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.query.id,
            {
                bannerImage: {
                    data: imageData,
                    contentType: imageFile.mimetype
                }
            },
            { new: true }
        );

        if (!updatedRestaurant) {
            throw new Error('Restaurant not found');
        }

        // Clean up
        await fs.unlink(imageFile.filepath);

        res.status(200).json({
            success: true,
            data: {
                ...updatedRestaurant.toObject(),
                bannerImage: `data:${imageFile.mimetype};base64,${imageData.toString('base64')}`
            }
        });
    } catch (error) {
        console.error('Error updating restaurant image:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Error updating restaurant image'
        });
    }
}

export default handler;