import mongoose from 'mongoose';

const PurchaseBillSchema = new mongoose.Schema({
    restaurantId: {
        type: String,
        required: [true, 'Restaurant ID is required']
    },
    vendorName: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
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
    items: [{
        name: {
            type: String,
            required: [true, 'Item name is required']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: 0
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            trim: true
        },
    }],
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: 0
    },
    taxPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finalAmount: {
        type: Number,
        required: [true, 'Final amount is required'],
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
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to calculate tax and final amount if not set
PurchaseBillSchema.pre('save', function (next) {
    if (!this.taxPercentage) {
        this.taxPercentage = 0;
    }

    if (!this.taxAmount) {
        this.taxAmount = (this.totalAmount * this.taxPercentage) / 100;
    }

    if (!this.finalAmount) {
        this.finalAmount = this.totalAmount + this.taxAmount;
    }

    next();
});

export default mongoose.models.PurchaseBill || mongoose.model('PurchaseBill', PurchaseBillSchema);