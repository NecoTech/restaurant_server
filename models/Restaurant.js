import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    bannerImage: String
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
