import dbConnect from '../../../lib/dbConnect';
import Restaurant from '../../../models/Restaurant';
import MenuItem from '../../../models/MenuItem';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    if (method === 'POST') {
        try {
            const restaurants = await Restaurant.find();
            if (restaurants.length === 0) {
                return res.status(400).json({ message: 'No restaurants found. Please add sample restaurants first.' });
            }

            const sampleItems = restaurants.flatMap(restaurant => [
                {
                    id: restaurant.id,
                    name: 'Margherita Pizza',
                    description: 'Classic tomato and mozzarella pizza',
                    price: 10.99,
                    category: 'Pizza',
                    image: 'https://picsum.photos/200/300.jpg'
                },
                {
                    id: restaurant.id,
                    name: 'Caesar Salad',
                    description: 'Romaine lettuce with Caesar dressing and croutons',
                    price: 7.99,
                    category: 'Salad',
                    image: 'https://picsum.photos/200/200.jpg'
                },
                {
                    id: restaurant.id,
                    name: 'Spaghetti Bolognese',
                    description: 'Spaghetti with meat sauce',
                    price: 13.99,
                    category: 'Pasta',
                    image: 'https://picsum.photos/200/400.jpg'
                },
                {
                    id: restaurant.id,
                    name: 'Chocolate Cake',
                    description: 'Rich chocolate layer cake',
                    price: 6.99,
                    category: 'Dessert',
                    image: 'https://picsum.photos/200/600.jpg'
                },
            ]);

            const insertedItems = await MenuItem.insertMany(sampleItems);
            res.status(201).json({ message: 'Sample menu items added successfully', menuItems: insertedItems });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);