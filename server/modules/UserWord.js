const mongoose = require('mongoose');
let userWordSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        // unique: false,
    },
    wordId: {
        type: String,
        required: true,
        // unique: true,
    },
    sence: {
        type: String,
        default: "A"
    },
    status: {
        type: String,
        required: true,
    },
    reviewCounts: {
        type: Number,
        default: 0
    },
    firstSeenAt: {
        type: Date,
        default: Date.now
    },
    lastSeenAt: {
        type: Date,
        default: Date.now
    },
    nextReviewTime: { // 推荐下次复习的时间
        type: Date,
        default: Date.now
    },
    priority: {
        type: Number,
        default: 0
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        default: 'vocabulary', // 默认来源是词汇练习，其他可能的值：story(情景模式)
        enum: ['vocabulary', 'story']
    }
});
userWordSchema.index({ userId: 1, wordId: 1 }, { unique: true });
const UserWord = mongoose.model('UserWord', userWordSchema);
module.exports = UserWord;