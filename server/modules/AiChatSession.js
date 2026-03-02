const mongoose = require('mongoose');

const aiChatSessionSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    scene: {
        type: String,
        required: true,
        enum: ['A', 'B'], // A: 酒店入住, B: 餐厅用餐
    },
    chapter: {
        type: String,
        required: true,
        enum: ['A', 'B'], // 对应用户当前章节
        default: 'A'
    },
    lastMessage: {
        type: String,
        default: ''
    },
    messageCount: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },
    tasks: [{
        id: Number,
        name: String,
        description: String,
        requiredWords: [String],
        minWords: Number,
        completed: {
            type: Boolean,
            default: false
        },
        usedWords: [String], // 用户在此任务中使用的单词
        completedAt: Date
    }],
    progress: {
        tasksCompleted: {
            type: Number,
            default: 0
        },
        totalTasks: {
            type: Number,
            default: 5
        },
        wordsUsed: {
            type: Number,
            default: 0
        },
        totalWords: {
            type: Number,
            default: 0
        },
        turnCount: {
            type: Number,
            default: 0
        }
    },
    completionCriteria: {
        minTasksCompleted: Number,
        minWordsUsed: Number,
        minTurns: Number
    },
    usedWords: [String], // 整个会话中使用的所有单词
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system']
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        taskId: Number, // 关联的任务ID
        wordsUsed: [String] // 此消息中使用的练习单词
    }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    completionReport: {
        totalDuration: Number, // 总耗时（分钟）
        tasksCompletedCount: Number,
        wordsUsedCount: Number,
        turnCount: Number,
        performance: String, // 'excellent', 'good', 'fair', 'needs_improvement'
        feedback: String
    }
}, {
    timestamps: true
});

// 索引
aiChatSessionSchema.index({ userid: 1, sessionId: 1 });
aiChatSessionSchema.index({ userid: 1, status: 1 });

// 实例方法：检查是否完成
aiChatSessionSchema.methods.checkCompletion = function() {
    const criteria = this.completionCriteria;
    const progress = this.progress;
    
    return progress.tasksCompleted >= criteria.minTasksCompleted &&
           progress.wordsUsed >= criteria.minWordsUsed &&
           progress.turnCount >= criteria.minTurns;
};

// 实例方法：更新进度
aiChatSessionSchema.methods.updateProgress = function() {
    this.progress.tasksCompleted = this.tasks.filter(task => task.completed).length;
    this.progress.wordsUsed = this.usedWords.length;
    this.progress.turnCount = this.messages.filter(msg => msg.role === 'user').length;
};

// 实例方法：添加消息并分析单词使用
aiChatSessionSchema.methods.addMessage = function(role, content, taskId = null) {
    const wordsUsed = this.extractUsedWords(content);
    
    this.messages.push({
        role,
        content,
        taskId,
        wordsUsed,
        timestamp: new Date()
    });
    
    // 更新已使用单词列表
    if (role === 'user' && wordsUsed.length > 0) {
        wordsUsed.forEach(word => {
            if (!this.usedWords.includes(word)) {
                this.usedWords.push(word);
            }
        });
        
        // 更新任务进度
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                wordsUsed.forEach(word => {
                    if (task.requiredWords.includes(word) && !task.usedWords.includes(word)) {
                        task.usedWords.push(word);
                    }
                });
                
                // 检查任务是否完成
                if (!task.completed && task.usedWords.length >= task.minWords) {
                    task.completed = true;
                    task.completedAt = new Date();
                }
            }
        }
    }
    
    this.updateProgress();
};

// 实例方法：从文本中提取使用的练习单词
aiChatSessionSchema.methods.extractUsedWords = function(text) {
    const allRequiredWords = [];
    this.tasks.forEach(task => {
        allRequiredWords.push(...task.requiredWords);
    });
    
    const uniqueWords = [...new Set(allRequiredWords)];
    const usedWords = [];
    
    const lowerText = text.toLowerCase();
    uniqueWords.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) {
            usedWords.push(word);
        }
    });
    
    return usedWords;
};

// 实例方法：生成完成报告
aiChatSessionSchema.methods.generateCompletionReport = function() {
    const duration = this.endTime ? 
        Math.round((this.endTime - this.startTime) / (1000 * 60)) : 0;
    
    const tasksCompletedCount = this.progress.tasksCompleted;
    const wordsUsedCount = this.progress.wordsUsed;
    const turnCount = this.progress.turnCount;
    
    let performance = 'needs_improvement';
    let feedback = '';
    
    // 评估表现
    const taskCompletionRate = tasksCompletedCount / this.progress.totalTasks;
    const wordUsageRate = wordsUsedCount / this.completionCriteria.minWordsUsed;
    
    if (taskCompletionRate >= 1 && wordUsageRate >= 1.5) {
        performance = 'excellent';
        feedback = '出色完成！您成功完成了所有任务并熟练使用了练习单词。';
    } else if (taskCompletionRate >= 0.8 && wordUsageRate >= 1) {
        performance = 'good';
        feedback = '表现良好！您完成了大部分任务并正确使用了单词。';
    } else if (taskCompletionRate >= 0.6 && wordUsageRate >= 0.7) {
        performance = 'fair';
        feedback = '基本完成任务，建议多练习单词的使用。';
    } else {
        feedback = '需要更多练习，建议重新尝试或复习相关单词。';
    }
    
    this.completionReport = {
        totalDuration: duration,
        tasksCompletedCount,
        wordsUsedCount,
        turnCount,
        performance,
        feedback
    };
    
    return this.completionReport;
};

const AiChatSession = mongoose.model('AiChatSession', aiChatSessionSchema);

module.exports = AiChatSession;