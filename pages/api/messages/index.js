import dbConnect from '../../../lib/dbConnect';
import Message from '../../../models/Message';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const { restaurantId, userEmail, lastMessageId, limit = 50 } = req.query;

                if (!restaurantId || !userEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Restaurant ID and user email are required'
                    });
                }

                let query = {
                    restaurantId,
                    isArchived: false
                };

                // Add pagination using lastMessageId if provided
                if (lastMessageId) {
                    query._id = { $lt: lastMessageId };
                }

                // Fetch messages and mark them as read
                const messages = await Message.find(query)
                    .sort({ createdAt: -1 })
                    .limit(parseInt(limit))
                    .populate('replyTo', 'content senderName');

                // Mark messages as read if recipient is requesting
                const unreadMessages = messages.filter(
                    msg => msg.senderEmail !== userEmail && !msg.readBy.some(read => read.userId === userEmail)
                );

                if (unreadMessages.length > 0) {
                    await Promise.all(
                        unreadMessages.map(msg => msg.markAsRead(userEmail))
                    );
                }

                // Get unread count for the user
                const unreadCount = await Message.getUnreadCount(restaurantId, userEmail);

                return res.status(200).json({
                    success: true,
                    data: messages,
                    unreadCount,
                    hasMore: messages.length === parseInt(limit)
                });

            } catch (error) {
                console.error('Error fetching messages:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching messages',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

        case 'POST':
            try {
                const {
                    content,
                    senderEmail,
                    senderRole,
                    senderName,
                    restaurantId,
                    replyTo,
                    messageType = 'text',
                    metadata = {},
                    attachments = []
                } = req.body;

                // Validate required fields
                if (!content || !senderEmail || !senderRole || !restaurantId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing required fields'
                    });
                }

                // Create new message
                const message = await Message.create({
                    content,
                    senderEmail,
                    senderRole,
                    senderName: senderName || senderEmail.split('@')[0],
                    restaurantId,
                    replyTo,
                    messageType,
                    metadata,
                    attachments,
                    status: 'sent',
                    readBy: [{ userId: senderEmail, readAt: new Date() }]
                });

                // Populate reply reference if exists
                if (replyTo) {
                    await message.populate('replyTo', 'content senderName');
                }

                return res.status(201).json({
                    success: true,
                    data: message
                });

            } catch (error) {
                console.error('Error creating message:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error creating message',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

        case 'PATCH':
            try {
                const { messageId } = req.query;
                const { status, readBy, isArchived } = req.body;

                if (!messageId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Message ID is required'
                    });
                }

                const updateData = {};
                if (status) updateData.status = status;
                if (readBy) updateData.$push = { readBy };
                if (typeof isArchived === 'boolean') updateData.isArchived = isArchived;

                const updatedMessage = await Message.findByIdAndUpdate(
                    messageId,
                    updateData,
                    { new: true }
                );

                if (!updatedMessage) {
                    return res.status(404).json({
                        success: false,
                        message: 'Message not found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: updatedMessage
                });

            } catch (error) {
                console.error('Error updating message:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error updating message',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
            return res.status(405).json({
                success: false,
                message: `Method ${method} Not Allowed`
            });
    }
}

export default withCors(handler);