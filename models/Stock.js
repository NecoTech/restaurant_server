import mongoose from 'mongoose';

const StockUpdateSchema = new mongoose.Schema({
    quantity: Number,
    updateImage: String,
    updateNote: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

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
        type: String,
        required: [true, 'Restaurant ID is required']
    },
    updateHistory: [StockUpdateSchema], // Array to store update history
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export default mongoose.models.Stock || mongoose.model('Stock', StockSchema);