import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide item name'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: 0
    },
    unit: {
        type: String,
        required: [true, 'Please provide unit of measurement'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Please provide price'],
        min: 0
    },
    minQuantity: {
        type: Number,
        default: 1,
        min: 1
    },
    description: {
        type: String,
        trim: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    restaurantId: {
        type: String,  // Changed from ObjectId to String
        required: [true, 'Restaurant ID is required']
    }
}, {
    timestamps: true
});

export default mongoose.models.Stock || mongoose.model('Stock', StockSchema);