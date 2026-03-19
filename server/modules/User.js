const mongoose = require('mongoose');
let userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
    },
    cet4: {
        position: {
            type: String,
            default: 'A:0'
        },
        // 移除冗余的关卡状态字段，只保留学习统计数据
        lastStudyTime: {
            type: Date,
            default: Date.now
        },
        learnedWords: {
            type: Number,
            default: 0
        },
        todayStudiedWords: {
            type: Number,
            default: 0
        },
        streakDays: {
            type: Number,
            default: 0
        },
        lastStudyDate: {
            type: Date,
            default: Date.now
        }
    },
    // 多章节进度支持
    chapters: {
        type: Map,
        of: {
            level: { type: Number, default: 1 },
            score: { type: Number, default: 0 },
            completedWords: { type: Number, default: 0 },
            wordP: { type: Boolean, default: false },
            spellP: { type: Boolean, default: false },
            listenP: { type: Boolean, default: false },
            customsP: { type: Boolean, default: false },
            coverP: { type: Boolean, default: false }
        },
        default: function() {
            return new Map([
                ['A', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }],
                ['B', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }]
            ]);
        }
    },
    currentChapter: {
        type: String,
        default: 'A'
    },
    totalWords: {
        type: Number,
        default: 0
    },
    // 学习历史记录
    studyHistory: {
        type: [{
            date: {
                type: Date,
                required: true
            },
            words: {
                type: Number,
                default: 0
            }
        }],
        default: []
    },
    planReviweWords: {
        type: Number,
        default: 30
    },
    planStudyWords: {
        type: Number,
        default: 30
    },
    question_completed: {
        type: Boolean,
        default: false
    },
    ai_choose_completed: {
        type: Boolean,
        default: false
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    // 签到相关字段
    checkIn: {
        lastCheckInDate: {
            type: Date,
            default: null
        },
        continuousCheckInDays: {
            type: Number,
            default: 0
        },
        totalCheckInDays: {
            type: Number,
            default: 0
        },
        checkInRewards: {
            type: Map,
            of: Boolean,
            default: new Map()
        }
    }
});
const User = mongoose.model('User', userSchema);
module.exports = User;