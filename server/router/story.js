const express = require('express');
const router = express.Router();
const { StoryProgressManager } = require('../modules/StoryProgress');
const TaskManager = require('../modules/TaskManager');
const { logger } = require('../utils/logger');

/**
 * 获取可用剧情列表
 */
router.get('/list', async (req, res) => {
  try {
    const storyScenes = require('../ai/storyScenes.json');
    const stories = Object.values(storyScenes).map(story => ({
      storyId: story.storyId,
      title: story.storyTitle,
      description: story.storyDescription,
      totalChapters: story.totalChapters
    }));

    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    logger.error('获取剧情列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取剧情列表失败'
    });
  }
});

/**
 * 获取剧情详情
 */
router.get('/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = TaskManager.getStoryConfig(storyId);

    // 如果用户已登录，获取用户进度
    let userProgress = null;
    if (req.user) {
      userProgress = await StoryProgressManager.getUserProgress(req.user._id, storyId);
    }

    res.json({
      success: true,
      data: {
        storyId: story.storyId,
        title: story.storyTitle,
        description: story.storyDescription,
        totalChapters: story.totalChapters,
        chapters: story.chapters.map(chapter => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          scene: chapter.scene,
          isLocked: userProgress && chapter.chapterId > userProgress.currentChapter
        })),
        userProgress
      }
    });
  } catch (error) {
    logger.error('获取剧情详情失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取剧情详情失败'
    });
  }
});

/**
 * 获取用户进度
 */
router.get('/:storyId/progress', async (req, res) => {
  try {
    const { storyId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const progress = await StoryProgressManager.getUserProgress(req.user._id, storyId);
    const chapterProgress = [];

    // 获取每个章节的进度
    const story = TaskManager.getStoryConfig(storyId);
    for (const chapter of story.chapters) {
      const chapterInfo = await StoryProgressManager.calculateChapterProgress(
        req.user._id,
        storyId,
        chapter.chapterId
      );
      chapterProgress.push({
        chapterId: chapter.chapterId,
        ...chapterInfo
      });
    }

    res.json({
      success: true,
      data: {
        progress,
        chapterProgress
      }
    });
  } catch (error) {
    logger.error('获取用户进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户进度失败'
    });
  }
});

/**
 * 开始章节
 */
router.post('/:storyId/chapter/:chapterId/start', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const chapterIdNum = parseInt(chapterId);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 检查章节是否解锁
    const progress = await StoryProgressManager.getUserProgress(req.user._id, storyId);
    if (chapterIdNum > progress.currentChapter) {
      return res.status(403).json({
        success: false,
        message: '章节未解锁'
      });
    }

    // 获取章节配置
    const chapter = TaskManager.getChapterConfig(storyId, chapterIdNum);

    // 获取已完成的任务
    const completedTasks = await StoryProgressManager.getChapterTasks(
      req.user._id,
      storyId,
      chapterIdNum
    );

    res.json({
      success: true,
      data: {
        chapterId: chapter.chapterId,
        title: chapter.title,
        scene: chapter.scene,
        aiRole: chapter.aiRole,
        userRole: chapter.userRole,
        storyBackground: chapter.storyBackground,
        tasks: chapter.tasks.map(task => ({
          ...task,
          isCompleted: completedTasks.some(ct => ct.taskId === task.id)
        })),
        completionCriteria: chapter.completionCriteria,
        nextChapterHint: chapter.nextChapterHint
      }
    });
  } catch (error) {
    logger.error('开始章节失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '开始章节失败'
    });
  }
});

/**
 * 完成任务
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/complete', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const chapterIdNum = parseInt(chapterId);
    const taskIdNum = parseInt(taskId);
    const taskData = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 获取任务配置
    const task = TaskManager.getTaskConfig(storyId, chapterIdNum, taskIdNum);

    // 验证任务完成
    const validationResult = TaskManager.validateTaskCompletion(task, taskData);

    // 生成反馈
    const feedback = TaskManager.generateTaskFeedback(task, validationResult, taskData);

    // 保存任务完成记录
    const result = await StoryProgressManager.completeTask(
      req.user._id,
      storyId,
      chapterIdNum,
      taskIdNum,
      {
        ...taskData,
        score: validationResult.score,
        type: task.type
      }
    );

    if (!result.success) {
      return res.json({
        success: false,
        message: result.message
      });
    }

    // 检查章节是否可以完成
    const completedTasks = await StoryProgressManager.getChapterTasks(
      req.user._id,
      storyId,
      chapterIdNum
    );

    const canComplete = TaskManager.canCompleteChapter(storyId, chapterIdNum, completedTasks);

    res.json({
      success: true,
      data: {
        feedback,
        canCompleteChapter: canComplete,
        progress: result.progress
      }
    });
  } catch (error) {
    logger.error('完成任务失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '完成任务失败'
    });
  }
});

/**
 * 完成章节
 */
router.post('/:storyId/chapter/:chapterId/complete', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const chapterIdNum = parseInt(chapterId);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 检查章节是否可以完成
    const completedTasks = await StoryProgressManager.getChapterTasks(
      req.user._id,
      storyId,
      chapterIdNum
    );

    const canComplete = TaskManager.canCompleteChapter(storyId, chapterIdNum, completedTasks);

    if (!canComplete) {
      return res.status(400).json({
        success: false,
        message: '章节任务未达到完成标准'
      });
    }

    // 完成章节
    const result = await StoryProgressManager.completeChapter(
      req.user._id,
      storyId,
      chapterIdNum
    );

    res.json({
      success: true,
      data: {
        progress: result.progress,
        nextChapter: result.progress.currentChapter
      }
    });
  } catch (error) {
    logger.error('完成章节失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '完成章节失败'
    });
  }
});

module.exports = router;
