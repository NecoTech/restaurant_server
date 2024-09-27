import mongoose from 'mongoose';

const WaiterAssistanceSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        required: true
    },
    tableNumber: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.WaiterAssistance || mongoose.model('WaiterAssistance', WaiterAssistanceSchema);