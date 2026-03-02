const mongoose = require('mongoose');

const StoryProgressSchema = new mongoose.Schema({
  // 用户ID
  userId: {
    type: String,
    required: true,
    index: true
  },

  // 剧情ID
  storyId: {
    type: String,
    required: true,
    index: true
  },

  // 当前章节ID
  currentChapterId: {
    type: Number,
    default: 1
  },

  // 章节进度
  chapters: [{
    chapterId: {
      type: Number,
      required: true
    },

    // 章节是否完成
    isCompleted: {
      type: Boolean,
      default: false
    },

    // 章节完成时间
    completedAt: {
      type: Date
    },

    // 任务进度
    tasks: [{
      taskId: {
        type: Number,
        required: true
      },

      // 任务是否完成
      isCompleted: {
        type: Boolean,
        default: false
      },

      // 任务完成时间
      completedAt: {
        type: Date
      },

      // 任务得分
      score: {
        type: Number,
        default: 0
      },

      // 任务最大得分
      maxScore: {
        type: Number,
        default: 100
      },

      // 任务数据
      taskData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },

      // 用户表现数据
      userPerformance: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },

      // 任务反馈
      feedback: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }],

    // 章节得分
    score: {
      type: Number,
      default: 0
    },

    // 章节最大得分
    maxScore: {
      type: Number,
      default: 100
    }
  }],

  // 剧情总进度
  totalScore: {
    type: Number,
    default: 0
  },

  // 剧情最大总分
  totalMaxScore: {
    type: Number,
    default: 100
  },

  // 剧情是否完成
  isCompleted: {
    type: Boolean,
    default: false
  },

  // 剧情完成时间
  completedAt: {
    type: Date
  },

  // 最后更新时间
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // 开始时间
  startedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建复合唯一索引
StoryProgressSchema.index({ userId: 1, storyId: 1 }, { unique: true });

// 更新时间中间件
StoryProgressSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// 静态方法: 获取或创建用户进度
StoryProgressSchema.statics.getOrCreate = async function(userId, storyId) {
  let progress = await this.findOne({ userId, storyId });

  if (!progress) {
    progress = new this({ userId, storyId });
    await progress.save();
  }

  return progress;
};

// 实例方法: 更新任务进度
StoryProgressSchema.methods.updateTaskProgress = async function(chapterId, taskId, taskData) {
  const chapter = this.chapters.find(ch => ch.chapterId === chapterId);

  if (!chapter) {
    throw new Error('章节不存在');
  }

  const task = chapter.tasks.find(t => t.taskId === taskId);

  if (!task) {
    throw new Error('任务不存在');
  }

  // 更新任务数据
  Object.assign(task, taskData);
  task.completedAt = new Date();

  // 更新章节进度
  this.updateChapterProgress(chapterId);

  // 更新总进度
  this.updateTotalProgress();

  await this.save();

  return task;
};

// 实例方法: 更新章节进度
StoryProgressSchema.methods.updateChapterProgress = function(chapterId) {
  const chapter = this.chapters.find(ch => ch.chapterId === chapterId);

  if (!chapter) {
    throw new Error('章节不存在');
  }

  // 计算章节得分
  const completedTasks = chapter.tasks.filter(t => t.isCompleted);
  if (completedTasks.length > 0) {
    const totalScore = completedTasks.reduce((sum, t) => sum + t.score, 0);
    const maxScore = completedTasks.reduce((sum, t) => sum + t.maxScore, 0);
    chapter.score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  }

  // 检查章节是否完成
  const allTasksCompleted = chapter.tasks.every(t => t.isCompleted);
  if (allTasksCompleted && !chapter.isCompleted) {
    chapter.isCompleted = true;
    chapter.completedAt = new Date();

    // 更新当前章节，确保能够解锁下一章
    if (this.currentChapterId <= chapterId) {
      this.currentChapterId = chapterId + 1;
    }
  }
};

// 实例方法: 更新总进度
StoryProgressSchema.methods.updateTotalProgress = function() {
  const completedChapters = this.chapters.filter(ch => ch.isCompleted);
  if (completedChapters.length > 0) {
    this.totalScore = Math.round(
      completedChapters.reduce((sum, ch) => sum + ch.score, 0) / completedChapters.length
    );
  }

  // 检查剧情是否完成
  const allChaptersCompleted = this.chapters.every(ch => ch.isCompleted);
  if (allChaptersCompleted && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
};

// 实例方法: 初始化章节
StoryProgressSchema.methods.initializeChapter = function(chapterId) {
  const existingChapter = this.chapters.find(ch => ch.chapterId === chapterId);

  if (existingChapter) {
    return existingChapter;
  }

  const newChapter = {
    chapterId,
    isCompleted: false,
    tasks: [],
    score: 0,
    maxScore: 100
  };

  this.chapters.push(newChapter);
  return newChapter;
};

// 实例方法: 初始化任务
StoryProgressSchema.methods.initializeTask = function(chapterId, taskId) {
  const chapter = this.initializeChapter(chapterId);

  const existingTask = chapter.tasks.find(t => t.taskId === taskId);

  if (existingTask) {
    return existingTask;
  }

  const newTask = {
    taskId,
    isCompleted: false,
    score: 0,
    maxScore: 100,
    taskData: {},
    userPerformance: {},
    feedback: {}
  };

  chapter.tasks.push(newTask);
  return newTask;
};

module.exports = mongoose.model('StoryProgress', StoryProgressSchema);
