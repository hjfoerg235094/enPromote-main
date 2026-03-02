
const mongoose = require('mongoose');
const { StoryProgressManager } = require('./StoryProgress');

// 剧情分支模型
const StoryBranchSchema = new mongoose.Schema({
  storyId: { type: String, required: true, index: true },
  chapterId: { type: Number, required: true },
  taskId: { type: Number, required: true },
  choiceId: { type: String, required: true },
  choiceText: { type: String, required: true },
  impact: { type: String, required: true },
  nextChapterId: { type: Number },
  alternativeChapters: [{ type: Number }],
  requiredScore: { type: Number, default: 0 },
  stylePreference: { type: String, enum: ['aggressive', 'balanced', 'careful'] },
  outcome: { type: String }, // 结局类型
  conditions: [{
    type: { type: String }, // score, style, choice
    value: { type: mongoose.Schema.Types.Mixed },
    operator: { type: String } // >, <, =, >=, <=, !=
  }]
}, {
  timestamps: true
});

// 创建索引
StoryBranchSchema.index({ storyId: 1, chapterId: 1, taskId: 1, choiceId: 1 }, { unique: true });

// 剧情结局模型
const StoryEndingSchema = new mongoose.Schema({
  storyId: { type: String, required: true, index: true },
  endingId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  conditions: [{
    type: { type: String }, // score, style, choices
    value: { type: mongoose.Schema.Types.Mixed },
    operator: { type: String }
  }],
  isGoodEnding: { type: Boolean, default: false },
  isBadEnding: { type: Boolean, default: false },
  isSecretEnding: { type: Boolean, default: false }
}, {
  timestamps: true
});

// 创建索引
StoryEndingSchema.index({ storyId: 1, endingId: 1 }, { unique: true });

const StoryBranch = mongoose.model('StoryBranch', StoryBranchSchema);
const StoryEnding = mongoose.model('StoryEnding', StoryEndingSchema);

class StoryBranchManager {
  /**
   * 获取任务的所有选择分支
   */
  static async getBranches(storyId, chapterId, taskId) {
    try {
      const branches = await StoryBranch.find({ storyId, chapterId, taskId });
      return branches;
    } catch (error) {
      console.error('获取任务分支失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户选择和表现确定下一章
   */
  static async determineNextChapter(userId, storyId, chapterId, taskId, choiceId, performance) {
    try {
      // 获取用户进度
      const progress = await StoryProgressManager.getUserProgress(userId, storyId);

      // 获取任务分支
      const branch = await StoryBranch.findOne({ 
        storyId, 
        chapterId, 
        taskId, 
        choiceId 
      });

      if (!branch) {
        // 如果没有特定分支，返回默认的下一章
        return { nextChapterId: chapterId + 1, outcome: null };
      }

      // 检查是否满足条件
      let meetsConditions = true;
      if (branch.conditions && branch.conditions.length > 0) {
        meetsConditions = this.checkConditions(progress, performance, branch.conditions);
      }

      if (!meetsConditions) {
        // 如果不满足条件，返回默认的下一章
        return { nextChapterId: chapterId + 1, outcome: null };
      }

      // 根据分支确定下一章
      let nextChapterId = branch.nextChapterId || chapterId + 1;

      // 如果有替代章节，根据用户表现选择
      if (branch.alternativeChapters && branch.alternativeChapters.length > 0) {
        const chapterPerformance = progress.chapterPerformance.find(p => p.chapterId === chapterId);
        if (chapterPerformance) {
          // 根据风格偏好选择章节
          if (branch.stylePreference && chapterPerformance.taskApproach === branch.stylePreference) {
            // 使用风格匹配的章节
            nextChapterId = branch.alternativeChapters[0];
          } else if (chapterPerformance.score >= (branch.requiredScore || 80)) {
            // 高分用户选择高难度章节
            nextChapterId = branch.alternativeChapters[1] || branch.alternativeChapters[0];
          }
        }
      }

      return { 
        nextChapterId, 
        outcome: branch.outcome 
      };
    } catch (error) {
      console.error('确定下一章失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否满足条件
   */
  static checkConditions(progress, performance, conditions) {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'score':
          return this.compare(performance.score, condition.value, condition.operator);
        case 'style':
          return performance.style === condition.value;
        case 'choice':
          return progress.globalKeyChoices.some(choice => 
            choice.choiceId === condition.value
          );
        default:
          return false;
      }
    });
  }

  /**
   * 比较值
   */
  static compare(actual, expected, operator) {
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '=': return actual === expected;
      case '!=': return actual !== expected;
      default: return false;
    }
  }

  /**
   * 获取剧情结局
   */
  static async getEnding(userId, storyId) {
    try {
      // 获取用户进度
      const progress = await StoryProgressManager.getUserProgress(userId, storyId);

      // 获取所有可能的结局
      const endings = await StoryEnding.find({ storyId });

      // 检查每个结局的条件
      for (const ending of endings) {
        if (this.checkEndingConditions(progress, ending.conditions)) {
          return ending;
        }
      }

      // 如果没有匹配的结局，返回默认结局
      return endings.find(e => e.endingId === 'default') || endings[0];
    } catch (error) {
      console.error('获取剧情结局失败:', error);
      throw error;
    }
  }

  /**
   * 检查结局条件
   */
  static checkEndingConditions(progress, conditions) {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      switch (condition.type) {
        case 'score':
          return this.compare(progress.totalScore, condition.value, condition.operator);
        case 'style':
          const dominantStyle = this.getDominantStyle(progress);
          return dominantStyle === condition.value;
        case 'choices':
          return condition.value.every(choiceId => 
            progress.globalKeyChoices.some(choice => choice.choiceId === choiceId)
          );
        default:
          return false;
      }
    });
  }

  /**
   * 获取主导风格
   */
  static getDominantStyle(progress) {
    const styleCounts = { aggressive: 0, balanced: 0, careful: 0 };
    progress.chapterPerformance.forEach(perf => {
      if (perf.taskApproach) {
        styleCounts[perf.taskApproach]++;
      }
    });

    return Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * 创建剧情分支
   */
  static async createBranch(branchData) {
    try {
      const branch = new StoryBranch(branchData);
      await branch.save();
      return branch;
    } catch (error) {
      console.error('创建剧情分支失败:', error);
      throw error;
    }
  }

  /**
   * 创建剧情结局
   */
  static async createEnding(endingData) {
    try {
      const ending = new StoryEnding(endingData);
      await ending.save();
      return ending;
    } catch (error) {
      console.error('创建剧情结局失败:', error);
      throw error;
    }
  }

  /**
   * 获取剧情树数据
   */
  static async getStoryTree(storyId) {
    try {
      // 获取剧情配置
      const storyConfig = require('../ai/storyScenes.json');
      const story = storyConfig[storyId];

      if (!story) {
        throw new Error('剧情不存在');
      }

      // 获取所有分支
      const branches = await StoryBranch.find({ storyId });

      // 构建剧情树
      const tree = {
        storyId: story.storyId,
        title: story.storyTitle,
        description: story.storyDescription,
        chapters: story.chapters.map(chapter => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          scene: chapter.scene,
          tasks: chapter.tasks.map(task => {
            const taskBranches = branches.filter(b => 
              b.chapterId === chapter.chapterId && b.taskId === task.id
            );

            return {
              taskId: task.id,
              name: task.name,
              type: task.type,
              branches: taskBranches.map(branch => ({
                choiceId: branch.choiceId,
                choiceText: branch.choiceText,
                impact: branch.impact,
                nextChapterId: branch.nextChapterId,
                alternativeChapters: branch.alternativeChapters,
                outcome: branch.outcome
              }))
            };
          })
        }))
      };

      return tree;
    } catch (error) {
      console.error('获取剧情树失败:', error);
      throw error;
    }
  }
}

module.exports = {
  StoryBranch,
  StoryEnding,
  StoryBranchManager
};
