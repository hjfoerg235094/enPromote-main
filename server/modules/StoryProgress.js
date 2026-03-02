const mongoose = require('mongoose');

// 用户剧情进度模型
const UserStoryProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storyId: { type: String, required: true },
  currentChapter: { type: Number, default: 1 },
  completedChapters: [{ type: Number }],
  totalScore: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  lastPlayedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  
  // 章节表现数据汇总
  chapterPerformance: [{
    chapterId: { type: Number, required: true },
    score: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // 总用时（秒）
    avgScore: { type: Number, default: 0 }, // 平均得分
    vocabularyUsed: [{ type: String }], // 使用过的词汇
    dialogueStyle: { type: String, enum: ['formal', 'casual', 'creative'], default: 'casual' }, // 主导对话风格
    taskApproach: { type: String, enum: ['careful', 'balanced', 'aggressive'], default: 'balanced' } // 主导任务方式
  }],
  
  // 难度调整系数
  difficultyMultiplier: { type: Number, default: 1.0, min: 0.5, max: 1.5 },
  
  // 全局关键选择汇总
  globalKeyChoices: [{
    chapterId: { type: Number },
    choiceId: { type: String },
    choiceText: { type: String },
    timestamp: { type: Date, default: Date.now },
    impact: { type: String }
  }],
  
  // 用户偏好分析
  userPreferences: {
    preferredDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    learningStyle: { type: String, enum: ['visual', 'auditory', 'reading', 'kinesthetic'], default: 'reading' },
    pacePreference: { type: String, enum: ['slow', 'normal', 'fast'], default: 'normal' }
  }
}, {
  timestamps: true
});

// 任务完成记录模型
const TaskCompletionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storyId: { type: String, required: true },
  chapterId: { type: Number, required: true },
  taskId: { type: Number, required: true },
  taskType: { type: String, required: true }, // dialogue, spelling, listening, reading
  score: { type: Number, default: 0 },
  wordsUsed: [{ type: String }],
  turns: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 }, // 秒
  
  // 用户表现数据
  performance: {
    taskApproach: { type: String, enum: ['careful', 'balanced', 'aggressive'], default: 'balanced' }, // 任务方式：谨慎、平衡、激进
    vocabularyLevel: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'intermediate' }, // 词汇水平
    dialogueStyle: { type: String, enum: ['formal', 'casual', 'creative'], default: 'casual' }, // 对话风格
    qualityScore: { type: Number, default: 0 }, // 表达质量得分
    mistakes: [{ // 错误记录
      type: { type: String }, // 错误类型：grammar, spelling, vocabulary
      word: { type: String }, // 错误单词
      correction: { type: String } // 正确形式
    }]
  },
  
  // 关键选择记录
  keyChoices: [{
    choiceId: { type: String }, // 选择ID
    choiceText: { type: String }, // 选择内容
    timestamp: { type: Date, default: Date.now }, // 选择时间
    impact: { type: String } // 影响描述
  }]
}, {
  timestamps: true
});

// 创建索引
UserStoryProgressSchema.index({ userId: 1, storyId: 1 }, { unique: true });
TaskCompletionSchema.index({ userId: 1, storyId: 1, chapterId: 1, taskId: 1 });

const UserStoryProgress = mongoose.model('UserStoryProgress', UserStoryProgressSchema);
const TaskCompletion = mongoose.model('TaskCompletion', TaskCompletionSchema);

class StoryProgressManager {
  /**
   * 获取用户的剧情进度
   */
  static async getUserProgress(userId, storyId) {
    try {
      const progress = await UserStoryProgress.findOne({ userId, storyId });
      if (!progress) {
        // 如果没有进度记录，创建新记录
        return await this.initializeProgress(userId, storyId);
      }
      return progress;
    } catch (error) {
      console.error('获取用户剧情进度失败:', error);
      throw error;
    }
  }

  /**
   * 初始化用户剧情进度
   */
  static async initializeProgress(userId, storyId) {
    try {
      const progress = new UserStoryProgress({
        userId,
        storyId,
        currentChapter: 1,
        completedChapters: [],
        totalScore: 0
      });
      await progress.save();
      return progress;
    } catch (error) {
      console.error('初始化用户剧情进度失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务完成情况
   */
  static async completeTask(userId, storyId, chapterId, taskId, taskData) {
    try {
      // 检查任务是否已完成
      const existingTask = await TaskCompletion.findOne({
        userId,
        storyId,
        chapterId,
        taskId
      });

      if (existingTask) {
        return { success: false, message: '任务已完成' };
      }

      // 创建任务完成记录
      const taskCompletion = new TaskCompletion({
        userId,
        storyId,
        chapterId,
        taskId,
        taskType: taskData.type,
        score: taskData.score || 0,
        wordsUsed: taskData.wordsUsed || [],
        turns: taskData.turns || 0,
        timeSpent: taskData.timeSpent || 0
      });

      await taskCompletion.save();

      // 更新剧情进度
      const progress = await this.getUserProgress(userId, storyId);
      progress.totalScore += taskData.score || 0;
      progress.lastPlayedAt = new Date();
      await progress.save();

      return { success: true, taskCompletion, progress };
    } catch (error) {
      console.error('更新任务完成情况失败:', error);
      throw error;
    }
  }

  /**
   * 完成章节
   */
  static async completeChapter(userId, storyId, chapterId) {
    try {
      const progress = await this.getUserProgress(userId, storyId);

      // 检查章节是否已完成
      if (progress.completedChapters.includes(chapterId)) {
        return { success: false, message: '章节已完成' };
      }

      // 添加到已完成章节
      progress.completedChapters.push(chapterId);

      // 更新当前章节
      if (progress.currentChapter === chapterId) {
        progress.currentChapter = chapterId + 1;
      }

      // 检查是否完成整个剧情
      const storyConfig = require('../ai/storyScenes.json');
      const story = storyConfig[storyId];
      if (story && progress.completedChapters.length >= story.totalChapters) {
        progress.completedAt = new Date();
      }

      await progress.save();

      return { success: true, progress };
    } catch (error) {
      console.error('完成章节失败:', error);
      throw error;
    }
  }

  /**
   * 获取章节任务完成情况
   */
  static async getChapterTasks(userId, storyId, chapterId) {
    try {
      const tasks = await TaskCompletion.find({
        userId,
        storyId,
        chapterId
      }).sort({ taskId: 1 });

      return tasks;
    } catch (error) {
      console.error('获取章节任务完成情况失败:', error);
      throw error;
    }
  }

  /**
   * 计算章节完成度
   */
  static async calculateChapterProgress(userId, storyId, chapterId) {
    try {
      const storyConfig = require('../ai/storyScenes.json');
      const story = storyConfig[storyId];

      if (!story) {
        throw new Error('剧情不存在');
      }

      const chapter = story.chapters.find(ch => ch.chapterId === chapterId);
      if (!chapter) {
        throw new Error('章节不存在');
      }

      const completedTasks = await this.getChapterTasks(userId, storyId, chapterId);
      const totalTasks = chapter.tasks.length;
      const completedCount = completedTasks.length;
      const progress = (completedCount / totalTasks) * 100;

      return {
        progress,
        completedCount,
        totalTasks,
        isCompleted: completedCount >= chapter.completionCriteria.minTasksCompleted
      };
    } catch (error) {
      console.error('计算章节完成度失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户所有剧情进度
   */
  static async getAllUserProgress(userId) {
    try {
      const progressList = await UserStoryProgress.find({ userId });
      return progressList;
    } catch (error) {
      console.error('获取用户所有剧情进度失败:', error);
      throw error;
    }
  }

  /**
   * 记录用户表现数据
   */
  static async recordPerformance(userId, storyId, chapterId, taskId, performanceData) {
    try {
      // 更新任务完成记录中的表现数据
      const taskCompletion = await TaskCompletion.findOneAndUpdate(
        { userId, storyId, chapterId, taskId },
        { $set: { performance: performanceData } },
        { new: true }
      );

      if (!taskCompletion) {
        throw new Error('任务记录不存在');
      }

      // 更新章节表现汇总
      await this.updateChapterPerformance(userId, storyId, chapterId);

      return { success: true, taskCompletion };
    } catch (error) {
      console.error('记录用户表现数据失败:', error);
      throw error;
    }
  }

  /**
   * 更新章节表现汇总
   */
  static async updateChapterPerformance(userId, storyId, chapterId) {
    try {
      const progress = await this.getUserProgress(userId, storyId);
      
      // 获取章节所有任务
      const tasks = await TaskCompletion.find({ userId, storyId, chapterId });
      
      if (tasks.length === 0) {
        return progress;
      }

      // 计算汇总数据
      const totalScore = tasks.reduce((sum, t) => sum + t.score, 0);
      const avgScore = totalScore / tasks.length;
      const totalTime = tasks.reduce((sum, t) => sum + t.timeSpent, 0);
      const allVocabulary = [...new Set(tasks.flatMap(t => t.wordsUsed))];
      
      // 统计主导对话风格
      const styleCounts = { formal: 0, casual: 0, creative: 0 };
      tasks.forEach(t => {
        if (t.performance?.dialogueStyle) {
          styleCounts[t.performance.dialogueStyle]++;
        }
      });
      const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0][0];

      // 统计主导任务方式
      const approachCounts = { careful: 0, balanced: 0, aggressive: 0 };
      tasks.forEach(t => {
        if (t.performance?.taskApproach) {
          approachCounts[t.performance.taskApproach]++;
        }
      });
      const dominantApproach = Object.entries(approachCounts).sort((a, b) => b[1] - a[1])[0][0];

      // 更新或创建章节表现记录
      const perfIndex = progress.chapterPerformance.findIndex(p => p.chapterId === chapterId);
      const perfData = {
        chapterId,
        score: totalScore,
        timeSpent: totalTime,
        avgScore,
        vocabularyUsed: allVocabulary,
        dialogueStyle: dominantStyle,
        taskApproach: dominantApproach
      };

      if (perfIndex >= 0) {
        progress.chapterPerformance[perfIndex] = perfData;
      } else {
        progress.chapterPerformance.push(perfData);
      }

      await progress.save();
      return progress;
    } catch (error) {
      console.error('更新章节表现汇总失败:', error);
      throw error;
    }
  }

  /**
   * 根据表现调整难度
   */
  static async adjustDifficulty(userId, storyId, chapterId) {
    try {
      const progress = await this.getUserProgress(userId, storyId);
      
      // 获取已完成的章节表现
      const completedPerf = progress.chapterPerformance.filter(p => 
        p.chapterId < chapterId
      );

      if (completedPerf.length === 0) {
        return { multiplier: 1.0, reason: '首次进入，使用默认难度' };
      }

      // 计算平均得分
      const avgScore = completedPerf.reduce((sum, p) => sum + p.avgScore, 0) / completedPerf.length;
      
      // 计算平均用时
      const avgTime = completedPerf.reduce((sum, p) => sum + p.timeSpent, 0) / completedPerf.length;

      // 根据表现调整难度
      let newMultiplier = 1.0;
      let reason = '';

      if (avgScore >= 90 && avgTime < 300) {
        // 表现优秀，提高难度
        newMultiplier = Math.min(1.3, progress.difficultyMultiplier + 0.1);
        reason = '表现优秀，提高难度以提供更大挑战';
      } else if (avgScore >= 80) {
        // 表现良好，适当提高难度
        newMultiplier = Math.min(1.2, progress.difficultyMultiplier + 0.05);
        reason = '表现良好，适当提高难度';
      } else if (avgScore < 60) {
        // 表现需要改进，降低难度
        newMultiplier = Math.max(0.8, progress.difficultyMultiplier - 0.1);
        reason = '需要更多练习，降低难度以帮助掌握';
      } else {
        // 表现正常，保持当前难度
        newMultiplier = progress.difficultyMultiplier;
        reason = '保持当前难度';
      }

      // 更新难度系数
      progress.difficultyMultiplier = newMultiplier;
      await progress.save();

      return { multiplier: newMultiplier, reason };
    } catch (error) {
      console.error('调整难度失败:', error);
      throw error;
    }
  }

  /**
   * 保存关键选择
   */
  static async saveKeyChoice(userId, storyId, chapterId, taskId, choiceData) {
    try {
      // 在任务记录中保存选择
      const taskCompletion = await TaskCompletion.findOneAndUpdate(
        { userId, storyId, chapterId, taskId },
        { $push: { keyChoices: choiceData } },
        { new: true }
      );

      if (!taskCompletion) {
        throw new Error('任务记录不存在');
      }

      // 在全局进度中保存选择
      const progress = await this.getUserProgress(userId, storyId);
      progress.globalKeyChoices.push({
        chapterId,
        ...choiceData
      });
      await progress.save();

      return { success: true, taskCompletion, progress };
    } catch (error) {
      console.error('保存关键选择失败:', error);
      throw error;
    }
  }

  /**
   * 获取章节表现数据
   */
  static async getChapterPerformance(userId, storyId, chapterId) {
    try {
      const progress = await this.getUserProgress(userId, storyId);
      const perf = progress.chapterPerformance.find(p => p.chapterId === chapterId);
      
      if (!perf) {
        // 如果没有汇总数据，实时计算
        const tasks = await TaskCompletion.find({ userId, storyId, chapterId });
        if (tasks.length > 0) {
          await this.updateChapterPerformance(userId, storyId, chapterId);
          const updatedProgress = await this.getUserProgress(userId, storyId);
          return updatedProgress.chapterPerformance.find(p => p.chapterId === chapterId);
        }
        return null;
      }

      return perf;
    } catch (error) {
      console.error('获取章节表现数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户偏好
   */
  static async getUserPreferences(userId, storyId) {
    try {
      const progress = await this.getUserProgress(userId, storyId);
      return progress.userPreferences;
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户偏好
   */
  static async updateUserPreferences(userId, storyId, preferences) {
    try {
      const progress = await this.getUserProgress(userId, storyId);
      Object.assign(progress.userPreferences, preferences);
      await progress.save();
      return progress.userPreferences;
    } catch (error) {
      console.error('更新用户偏好失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史关键选择
   */
  static async getKeyChoices(userId, storyId, chapterId) {
    try {
      const progress = await this.getUserProgress(userId, storyId);
      // 获取指定章节之前的所有关键选择
      const choices = progress.globalKeyChoices.filter(c => c.chapterId < chapterId);
      return choices;
    } catch (error) {
      console.error('获取历史关键选择失败:', error);
      throw error;
    }
  }
}

module.exports = {
  UserStoryProgress,
  TaskCompletion,
  StoryProgressManager
};
