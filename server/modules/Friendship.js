const mongoose = require('mongoose');

// 好友关系表
const friendshipSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    friendId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending'
    },
    remark: {
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
friendshipSchema.index({ userId: 1, status: 1 });
friendshipSchema.index({ friendId: 1, status: 1 });

// 更新时间中间件
friendshipSchema.pre('save', function(next) {
    this.updateTime = new Date();
    next();
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
