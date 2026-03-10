const mongoose = require('mongoose');

// 好友请求表
const friendRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: String,
        required: true,
        index: true
    },
    toUserId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: {
        type: String,
        default: ''
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }
});

// 创建复合索引
friendRequestSchema.index({ toUserId: 1, status: 1 });
friendRequestSchema.index({ fromUserId: 1, status: 1 });

// 更新时间中间件
friendRequestSchema.pre('save', function(next) {
    this.updateTime = new Date();
    next();
});

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
