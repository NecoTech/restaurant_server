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
    restaurantType: {
        type: String,
        required: [true, 'Restaurant type is required'],
        enum: ['Restaurant', 'Canteen'],
        trim: true
    },
    fssaiCode: {
        type: String,
        required: [true, 'FSSAI License code is required'],
        trim: true
    },
    bannerImage: {
        type: String,
        default: null
    },
    ownerEmail: {
        type: String,
        required: [true, 'Owner email is required'],
        trim: true,
        lowercase: true
    },
    isOnline: {
        type: Boolean,
        default: true
    },
    currency: {
        type: String,
        default: '₹'
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);