import dbConnect from '../../../lib/dbConnect';
import Restaurant from '../../../models/Restaurant';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    if (method === 'POST') {
        try {
            const sampleRestaurants = [
                { id: "rest001", name: "Pizza Palace", bannerImage: "https://picsum.photos/200/300.jpg" },
                { id: "rest002", name: "Burger Bonanza", bannerImage: "https://picsum.photos/200/400.jpg" },
                { id: "rest003", name: "Sushi Supreme", bannerImage: "https://picsum.photos/200/200.jpg" }
            ];

            const insertedRestaurants = await Restaurant.insertMany(sampleRestaurants);
            res.status(201).json({ message: 'Sample restaurants added successfully', restaurants: insertedRestaurants });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}
export default withCors(handler);