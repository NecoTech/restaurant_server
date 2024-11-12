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

    switch (method) {
        case 'GET':
            try {
                const { email } = req.query;
                const restaurants = await Restaurant.find(
                    email ? { ownerEmail: email } : {}
                );

                const restaurantsWithImages = restaurants.map(restaurant => {
                    const base64Image = restaurant.bannerImage?.data
                        ? `data:${restaurant.bannerImage.contentType};base64,${restaurant.bannerImage.data.toString('base64')}`
                        : null;

                    return {
                        ...restaurant.toObject(),
                        bannerImage: base64Image
                    };
                });

                res.status(200).json(restaurantsWithImages);
            } catch (error) {
                res.status(500).json({ success: false, message: 'Error fetching restaurants' });
            }
            break;

        case 'POST':
            try {
                const form = formidable({
                    keepExtensions: true,
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                });

                // Parse the form data with proper error handling
                const parseForm = async (): Promise<[formidable.Fields<string>, formidable.Files]> => {
                    return new Promise((resolve, reject) => {
                        form.parse(req, (err, fields, files) => {
                            if (err) return reject(err);
                            resolve([fields, files]);
                        });
                    });
                };

                // Get the form data
                const [fields, files] = await parseForm();

                // Access the image file correctly based on formidable v4 structure
                const imageFile = files.image?.[0];  // Note the change here to access the first file

                if (!imageFile) {
                    throw new Error('No image file uploaded');
                }

                // Read the file data using the correct path
                const imageData = await fs.readFile(imageFile.filepath);

                // Create the restaurant with the correct field access
                const restaurant = await Restaurant.create({
                    id: fields.id?.[0],          // Access the first value of each field
                    name: fields.name?.[0],
                    ownerEmail: fields.ownerEmail?.[0],
                    bannerImage: {
                        data: imageData,
                        contentType: imageFile.mimetype
                    }
                });

                // Clean up the temporary file
                await fs.unlink(imageFile.filepath);

                // Send response with base64 image
                res.status(201).json({
                    success: true,
                    data: {
                        ...restaurant.toObject(),
                        bannerImage: `data:${imageFile.mimetype};base64,${imageData.toString('base64')}`
                    }
                });

            } catch (error) {
                console.error('Error creating restaurant:', error);
                res.status(400).json({
                    success: false,
                    message: error instanceof Error ? error.message : 'Error creating restaurant'
                });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default handler;