const mongoose = require('mongoose');

// 用户设置表
const userSettingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    privacy: {
        showInRanking: {
            type: Boolean,
            default: true
        },
        showProgressToFriends: {
            type: Boolean,
            default: true
        },
        allowFriendRequest: {
            type: Boolean,
            default: true
        },
        showOnlineStatus: {
            type: Boolean,
            default: true
        }
    },
    notification: {
        rankingChange: {
            type: Boolean,
            default: true
        },
        friendActivity: {
            type: Boolean,
            default: true
        },
        friendRequest: {
            type: Boolean,
            default: true
        }
    },
    updateTime: {
        type: Date,
        default: Date.now
    }
});

// 更新时间中间件
userSettingsSchema.pre('save', function(next) {
    this.updateTime = new Date();
    next();
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings;
