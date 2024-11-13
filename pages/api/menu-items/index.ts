import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import { withCors } from '@/lib/cors';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
    api: {
        bodyParser: false,
    },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const { restaurantId } = query;
                let menuItems;

                if (restaurantId) {
                    menuItems = await MenuItem.find({ id: restaurantId });
                } else {
                    menuItems = await MenuItem.find();
                }

                // Convert buffer to base64 string for each menu item
                const menuItemsWithImages = menuItems.map(item => {
                    const base64Image = item.image?.data
                        ? `data:${item.image.contentType};base64,${item.image.data.toString('base64')}`
                        : null;

                    return {
                        ...item.toObject(),
                        image: base64Image
                    };
                });

                res.status(200).json(menuItemsWithImages);
            } catch (error) {
                console.error('Error fetching menu items:', error);
                res.status(500).json({ message: 'Error fetching menu items' });
            }
            break;

        case 'POST':
            try {
                const form = formidable({
                    keepExtensions: true,
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                });

                // Parse form data
                const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
                    form.parse(req, (err, fields, files) => {
                        if (err) reject(err);
                        resolve([fields, files]);
                    });
                });

                const imageFile = files.image?.[0];
                if (!imageFile) {
                    throw new Error('No image file uploaded');
                }

                // Read the file data
                const imageData = await fs.readFile(imageFile.filepath);

                // Create menu item
                const menuItem = await MenuItem.create({
                    name: fields.name?.[0],
                    description: fields.description?.[0],
                    price: parseFloat(fields.price?.[0] || '0'),
                    category: fields.category?.[0],
                    id: fields.restaurantId?.[0],
                    image: {
                        data: imageData,
                        contentType: imageFile.mimetype
                    }
                });

                // Clean up uploaded file
                await fs.unlink(imageFile.filepath);

                res.status(201).json({
                    success: true,
                    data: {
                        ...menuItem.toObject(),
                        image: `data:${imageFile.mimetype};base64,${imageData.toString('base64')}`
                    }
                });
            } catch (error) {
                console.error('Error creating menu item:', error);
                res.status(400).json({ message: error instanceof Error ? error.message : 'Error creating menu item' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);