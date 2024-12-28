import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true
    },
    senderEmail: {
        type: String,
        required: [true, 'Sender email is required'],
        trim: true
    },
    senderRole: {
        type: String,
        enum: ['admin', 'kitchen', 'waiter'],
        required: [true, 'Sender role is required']
    },
    senderName: {
        type: String,
        required: [true, 'Sender name is required'],
        trim: true
    },
    restaurantId: {
        type: String,
        required: [true, 'Restaurant ID is required']
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'notification'],
        default: 'text'
    },
    readBy: [{
        userId: String,
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        url: String,
        type: String,
        name: String,
        size: Number
    }],
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    metadata: {
        orderNumber: String,
        tableNumber: Number,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes for better query performance
MessageSchema.index({ restaurantId: 1, createdAt: -1 });
MessageSchema.index({ senderEmail: 1, restaurantId: 1 });
MessageSchema.index({ status: 1 });

// Virtual for checking if message is read
MessageSchema.virtual('isRead').get(function () {
    return this.status === 'read';
});

// Method to mark message as read
MessageSchema.methods.markAsRead = async function (userId) {
    if (!this.readBy.some(read => read.userId === userId)) {
        this.readBy.push({ userId, readAt: new Date() });
        this.status = 'read';
        await this.save();
    }
    return this;
};

// Static method to get unread messages count
MessageSchema.statics.getUnreadCount = async function (restaurantId, userEmail) {
    return this.countDocuments({
        restaurantId,
        'readBy.userId': { $ne: userEmail },
        senderEmail: { $ne: userEmail },
        isArchived: false
    });
};

// Static method to get conversation between users
MessageSchema.statics.getConversation = async function (restaurantId, limit = 50, offset = 0) {
    return this.find({
        restaurantId,
        isArchived: false
    })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('replyTo', 'content senderName');
};

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;