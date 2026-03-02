const storyScenes = require('../ai/storyScenes.json');
const { TaskCompletion } = require('./StoryProgress');

class TaskManager {
  /**
   * 获取剧情配置
   */
  static getStoryConfig(storyId) {
    const story = storyScenes[storyId];
    if (!story) {
      throw new Error('剧情不存在');
    }
    return story;
  }

  /**
   * 获取章节配置
   */
  static getChapterConfig(storyId, chapterId) {
    const story = this.getStoryConfig(storyId);
    const chapter = story.chapters.find(ch => ch.chapterId === chapterId);
    if (!chapter) {
      throw new Error('章节不存在');
    }
    return chapter;
  }

  /**
   * 获取任务配置
   */
  static getTaskConfig(storyId, chapterId, taskId) {
    const chapter = this.getChapterConfig(storyId, chapterId);
    const task = chapter.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('任务不存在');
    }
    return task;
  }

  /**
   * 验证任务完成
   */
  static validateTaskCompletion(task, taskData) {
    const criteria = task.completionCriteria || {};
    let score = 0;
    let maxScore = 100;

    switch (task.type) {
      case 'dialogue':
        // 对话任务验证
        const wordsUsed = taskData.wordsUsed || [];
        const requiredWords = task.requiredWords || [];
        const matchedWords = wordsUsed.filter(word => requiredWords.includes(word));

        // 单词使用得分
        const wordScore = (matchedWords.length / Math.max(task.minWords, 1)) * 40;

        // 对话轮次得分
        const turns = taskData.turns || 0;
        const turnScore = Math.min((turns / (criteria.minTurns || 4)) * 30, 30);

        // 响应质量得分（由AI评估）
        const qualityScore = taskData.qualityScore || 30;

        score = wordScore + turnScore + qualityScore;
        break;

      case 'spelling':
        // 拼写任务验证
        const correctRate = taskData.correctRate || 0;
        score = correctRate * 100;
        break;

      case 'listening':
        // 听力任务验证
        const correctAnswers = taskData.correctAnswers || 0;
        const totalQuestions = taskData.totalQuestions || criteria.minCorrectAnswers || 3;
        score = (correctAnswers / totalQuestions) * 100;
        break;

      case 'reading':
        // 阅读任务验证
        const readingCorrectAnswers = taskData.correctAnswers || 0;
        const readingTotalQuestions = taskData.totalQuestions || criteria.minCorrectAnswers || 3;
        score = (readingCorrectAnswers / readingTotalQuestions) * 100;
        break;

      default:
        score = 0;
    }

    return {
      score: Math.round(score),
      maxScore,
      isCompleted: score >= 60 // 60分及格
    };
  }

  /**
   * 生成任务反馈
   */
  static generateTaskFeedback(task, validationResult, taskData) {
    const feedback = {
      score: validationResult.score,
      maxScore: validationResult.maxScore,
      isCompleted: validationResult.isCompleted,
      message: '',
      improvements: []
    };

    switch (task.type) {
      case 'dialogue':
        const wordsUsed = taskData.wordsUsed || [];
        const requiredWords = task.requiredWords || [];
        const missedWords = requiredWords.filter(word => !wordsUsed.includes(word));

        if (missedWords.length > 0) {
          feedback.improvements.push(`建议尝试使用这些单词: ${missedWords.join(', ')}`);
        }

        if (validationResult.isCompleted) {
          feedback.message = '太棒了！你的对话表现很棒，单词使用也很准确！';
        } else {
          feedback.message = '继续努力！多练习对话，尝试使用更多目标单词。';
        }
        break;

      case 'spelling':
        if (validationResult.isCompleted) {
          feedback.message = '拼写正确！继续保持！';
        } else {
          feedback.message = '有些单词拼写不太准确，多练习几次！';
          feedback.improvements.push('注意单词的大小写和拼写规则');
        }
        break;

      case 'listening':
        if (validationResult.isCompleted) {
          feedback.message = '听力理解很棒！';
        } else {
          feedback.message = '听力还需要加强，多听几次！';
          feedback.improvements.push('注意听关键词和上下文');
        }
        break;

      case 'reading':
        if (validationResult.isCompleted) {
          feedback.message = '阅读理解能力很好！';
        } else {
          feedback.message = '阅读理解需要加强，多读几遍！';
          feedback.improvements.push('注意理解文章的主旨和细节');
        }
        break;
    }

    return feedback;
  }

  /**
   * 获取任务提示
   */
  static getTaskHints(task) {
    return task.hints || [];
  }

  /**
   * 获取章节所有任务
   */
  static getChapterTasks(storyId, chapterId) {
    const chapter = this.getChapterConfig(storyId, chapterId);
    return chapter.tasks;
  }

  /**
   * 检查章节是否可以完成
   */
  static canCompleteChapter(storyId, chapterId, completedTasks) {
    const chapter = this.getChapterConfig(storyId, chapterId);
    const criteria = chapter.completionCriteria;

    const completedCount = completedTasks.length;
    const minTasksCompleted = criteria.minTasksCompleted;

    return completedCount >= minTasksCompleted;
  }
}

module.exports = TaskManager;
