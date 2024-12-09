import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: String,
    planId: {
        type: String,
        enum: ['monthly', 'biannual', 'annual'],
        required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    price: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);