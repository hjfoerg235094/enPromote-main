
const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    lastMessageTime: {
        type: Date
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    }
}, {
    timestamps: true
});

// 索引
chatConversationSchema.index({ participants: 1, updatedAt: -1 });
chatConversationSchema.index({ 'unreadCount': 1 });

// 方法：更新未读消息计数
chatConversationSchema.methods.updateUnreadCount = async function(userId) {
    const ChatMessage = mongoose.model('ChatMessage');
    const unreadCount = await ChatMessage.countDocuments({
        toUserId: userId,
        isRead: false
    });
    this.unreadCount.set(userId, unreadCount);
    await this.save();
    return unreadCount;
};

// 方法：标记消息为已读
chatConversationSchema.methods.markAsRead = async function(userId) {
    const ChatMessage = mongoose.model('ChatMessage');
    await ChatMessage.updateMany(
        {
            toUserId: userId,
            isRead: false
        },
        {
            isRead: true,
            readAt: new Date()
        }
    );
    this.unreadCount.set(userId, 0);
    await this.save();
};

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
