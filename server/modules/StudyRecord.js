
const mongoose = require('mongoose');

const studyRecordSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    // 学习时长统计（分钟）
    totalStudyTime: {
        type: Number,
        default: 0
    },
    moduleStudyTime: {
        vocabulary: {
            type: Number,
            default: 0
        },
        listening: {
            type: Number,
            default: 0
        },
        spelling: {
            type: Number,
            default: 0
        },
        aiPractice: {
            type: Number,
            default: 0
        }
    },
    // 单词学习统计
    wordsLearned: {
        newWords: {
            type: Number,
            default: 0
        },
        reviewWords: {
            type: Number,
            default: 0
        }
    },
    // 练习统计
    practiceStats: {
        spellingAccuracy: {
            type: Number,
            default: 0
        },
        listeningCompletion: {
            type: Number,
            default: 0
        },
        aiPracticeCount: {
            type: Number,
            default: 0
        }
    },
    // 效率指标
    efficiency: {
        wordsPerMinute: {
            type: Number,
            default: 0
        },
        masteryRate: {
            type: Number,
            default: 0
        },
        masterySpeed: {
            type: Number,
            default: 0
        }
    },
    // 学习会话记录
    sessions: [{
        startTime: Date,
        endTime: Date,
        module: String, // 'vocabulary', 'listening', 'spelling', 'aiPractice'
        wordsCount: Number,
        accuracy: Number
    }]
}, {
    timestamps: true
});

// 创建复合索引以优化查询
studyRecordSchema.index({ userId: 1, date: -1 });

const StudyRecord = mongoose.model('StudyRecord', studyRecordSchema);

module.exports = StudyRecord;
