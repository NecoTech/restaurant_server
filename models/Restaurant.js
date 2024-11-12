import mongoose from 'mongoose';

const RestaurantSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Restaurant ID is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true
    },
    bannerImage: {
        data: Buffer,
        contentType: String
    },
    ownerEmail: {
        type: String,
        required: [true, 'Owner email is required'],
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);
