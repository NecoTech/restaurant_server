import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import MenuItem from '@/models/MenuItem';
import { withCors } from '@/lib/cors';
import formidable from 'formidable';
import fs from 'fs/promises';

interface UpdateMenuItemData {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    image?: {
        data: Buffer;
        contentType: string;
    };
}

export const config = {
    api: {
        bodyParser: false,
    },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query: { id } } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const menuItem = await MenuItem.findById(id);
                if (!menuItem) {
                    return res.status(404).json({ message: 'Menu item not found' });
                }

                // Convert image buffer to base64
                const base64Image = menuItem.image?.data
                    ? `data:${menuItem.image.contentType};base64,${menuItem.image.data.toString('base64')}`
                    : null;

                res.status(200).json({
                    ...menuItem.toObject(),
                    image: base64Image
                });
            } catch (error) {
                res.status(500).json({ message: 'Error fetching menu item' });
            }
            break;

        case 'PUT':
            try {
                const form = formidable({
                    keepExtensions: true,
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                });

                const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
                    form.parse(req, (err, fields, files) => {
                        if (err) reject(err);
                        resolve([fields, files]);
                    });
                });

                const updateData: UpdateMenuItemData = {
                    ...(fields.name?.[0] && { name: fields.name[0] }),
                    ...(fields.description?.[0] && { description: fields.description[0] }),
                    ...(fields.price?.[0] && { price: parseFloat(fields.price[0]) }),
                    ...(fields.category?.[0] && { category: fields.category[0] }),
                };

                // Handle image update if new image is uploaded
                const imageFile = files.image?.[0];
                if (imageFile) {
                    const imageData = await fs.readFile(imageFile.filepath);
                    updateData.image = {
                        data: imageData,
                        contentType: imageFile.mimetype
                    };
                    await fs.unlink(imageFile.filepath);
                }

                const updatedMenuItem = await MenuItem.findByIdAndUpdate(
                    id,
                    updateData,
                    { new: true }
                );

                if (!updatedMenuItem) {
                    return res.status(404).json({ message: 'Menu item not found' });
                }

                const responseData = {
                    ...updatedMenuItem.toObject(),
                    image: imageFile && updateData.image
                        ? `data:${imageFile.mimetype};base64,${updateData.image.data.toString('base64')}`
                        : undefined
                };

                res.status(200).json({
                    success: true,
                    data: responseData
                });
            } catch (error) {
                res.status(400).json({ message: error instanceof Error ? error.message : 'Error updating menu item' });
            }
            break;

        case 'DELETE':
            try {
                const deletedMenuItem = await MenuItem.findByIdAndDelete(id);
                if (!deletedMenuItem) {
                    return res.status(404).json({ message: 'Menu item not found' });
                }
                res.status(200).json({ message: 'Menu item deleted successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Error deleting menu item' });
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);