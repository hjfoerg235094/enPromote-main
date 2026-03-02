const mongoose = require('mongoose');

// 题目类型枚举
const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',  // 选择题
  FILL_IN_BLANK: 'fill_in_blank',      // 填空题
  LISTENING: 'listening',              // 听力题
  SCENARIO: 'scenario',                // 情景对话题
  LISTENING_COMPREHENSION: 'listening_comprehension',  // 听力理解题
  CLOZE_TEST: 'cloze_test',            // 完形填空题
  TRANSLATION: 'translation',          // 翻译题
  WRITING: 'writing',                   // 写作题
  TRUE_FALSE: 'true_false'              // 判断题
};

// 难度级别
const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  EXPERT: 4
};

// 题目Schema
let questionSchema = new mongoose.Schema({
  // 用户ID
  userId: {
    type: String,
    required: true,
    index: true
  },

  // 章节ID (A, B, C, ...)
  chapter: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    index: true
  },

  // 关卡 (1-5)
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // 题目类型
  questionType: {
    type: String,
    required: true,
    enum: Object.values(QUESTION_TYPES)
  },

  // 难度级别
  difficulty: {
    type: Number,
    required: true,
    enum: Object.values(DIFFICULTY_LEVELS)
  },

  // 题目内容
  question: {
    type: String,
    required: true
  },

  // 题目内容哈希值（用于去重）
  questionHash: {
    type: String,
    index: true
  },

  // 选项 (选择题用)
  options: [{
    key: String,      // 选项标识 (A, B, C, D)
    content: String   // 选项内容
  }],

  // 正确答案
  correctAnswer: {
    type: String,
    required: true
  },

  // 解析
  explanation: String,

  // 相关单词
  relatedWords: [{
    wordId: String,
    word: String,
    meaning: String
  }],

  // 题目状态
  status: {
    type: String,
    enum: ['pending', 'completed', 'skipped'],
    default: 'pending'
  },

  // 用户答案
  userAnswer: String,

  // 是否正确
  isCorrect: {
    type: Boolean,
    default: null
  },

  // 答题时间 (毫秒)
  timeSpent: Number,

  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },

  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 创建复合索引
questionSchema.index({ userId: 1, chapter: 1, level: 1 });
questionSchema.index({ userId: 1, status: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = {
  Question,
  QUESTION_TYPES,
  DIFFICULTY_LEVELS
};
