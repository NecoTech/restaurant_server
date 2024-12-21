import mongoose from 'mongoose';

const OtherBillSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        required: [true, 'Restaurant ID is required']
    },
    billType: {
        type: String,
        required: [true, 'Bill type is required'],
        enum: ['Utility', 'Rent', 'Maintenance', 'Insurance', 'License', 'Tax', 'Other']
    },
    billNumber: {
        type: String,
        required: [true, 'Bill number is required'],
        trim: true
    },
    billDate: {
        type: Date,
        required: [true, 'Bill date is required']
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PARTIAL', 'PAID'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export default mongoose.models.OtherBill || mongoose.model('OtherBill', OtherBillSchema);