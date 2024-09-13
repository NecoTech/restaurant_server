// models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        _id: String,
        id: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        description: String
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    tableNumber: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['counter', 'googlepay'],
        required: true
    },
    paid: {
        type: Boolean,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    restaurantId: {
        type: String,
        required: true
    },
    phonenumber: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);