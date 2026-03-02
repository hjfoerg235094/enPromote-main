const express = require('express');
const router = express.Router();
const StoryProgress = require('../models/StoryProgress');
const storyScenes = require('../ai/storyScenes.json');

/**
 * 获取用户剧情进度
 * GET /api/story/progress/:storyId
 */
router.get('/progress/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取或创建用户进度
    const progress = await StoryProgress.getOrCreate(userId, storyId);

    res.json({
      success: true,
      data: {
        storyId: progress.storyId,
        currentChapterId: progress.currentChapterId,
        chapters: progress.chapters,
        totalScore: progress.totalScore,
        totalMaxScore: progress.totalMaxScore,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        lastUpdated: progress.lastUpdated,
        startedAt: progress.startedAt
      }
    });
  } catch (error) {
    console.error('获取剧情进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取剧情进度失败'
    });
  }
});

/**
 * 获取用户所有剧情进度
 * GET /api/story/progress
 */
router.get('/progress', async (req, res) => {
  try {
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取用户所有剧情进度
    const progresses = await StoryProgress.find({ userId });

    // 添加剧情详情
    const progressesWithDetails = progresses.map(progress => {
      const story = storyScenes[progress.storyId];
      return {
        storyId: progress.storyId,
        title: story?.storyTitle || progress.storyId,
        description: story?.storyDescription || '',
        totalChapters: story?.totalChapters || 0,
        currentChapterId: progress.currentChapterId,
        totalScore: progress.totalScore,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        lastUpdated: progress.lastUpdated,
        startedAt: progress.startedAt
      };
    });

    res.json({
      success: true,
      data: progressesWithDetails
    });
  } catch (error) {
    console.error('获取所有剧情进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取所有剧情进度失败'
    });
  }
});

/**
 * 初始化章节任务
 * POST /api/story/:storyId/chapter/:chapterId/initialize
 */
router.post('/:storyId/chapter/:chapterId/initialize', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取或创建用户进度
    const progress = await StoryProgress.getOrCreate(userId, storyId);

    // 获取章节配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    // 初始化章节和任务
    progress.initializeChapter(parseInt(chapterId));
    chapter.tasks.forEach(task => {
      progress.initializeTask(parseInt(chapterId), task.id);
    });

    await progress.save();

    res.json({
      success: true,
      data: {
        chapterId: chapter.chapterId,
        tasks: progress.chapters.find(ch => ch.chapterId === parseInt(chapterId))?.tasks || []
      }
    });
  } catch (error) {
    console.error('初始化章节失败:', error);
    res.status(500).json({
      success: false,
      message: '初始化章节失败'
    });
  }
});

/**
 * 更新任务进度
 * POST /api/story/:storyId/chapter/:chapterId/task/:taskId/progress
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/progress', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const taskData = req.body;

    // 获取或创建用户进度
    const progress = await StoryProgress.getOrCreate(userId, storyId);

    // 初始化任务（如果尚未初始化）
    progress.initializeTask(parseInt(chapterId), parseInt(taskId));

    // 更新任务进度
    const updatedTask = await progress.updateTaskProgress(
      parseInt(chapterId),
      parseInt(taskId),
      {
        isCompleted: taskData.isCompleted || false,
        score: taskData.score || 0,
        maxScore: taskData.maxScore || 100,
        taskData: taskData.taskData || {},
        userPerformance: taskData.userPerformance || {},
        feedback: taskData.feedback || {}
      }
    );

    res.json({
      success: true,
      data: {
        task: updatedTask,
        chapter: progress.chapters.find(ch => ch.chapterId === parseInt(chapterId)),
        totalScore: progress.totalScore,
        isCompleted: progress.isCompleted
      }
    });
  } catch (error) {
    console.error('更新任务进度失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务进度失败'
    });
  }
});

/**
 * 获取章节进度
 * GET /api/story/:storyId/chapter/:chapterId/progress
 */
router.get('/:storyId/chapter/:chapterId/progress', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取用户进度
    const progress = await StoryProgress.findOne({ userId, storyId });

    if (!progress) {
      return res.json({
        success: true,
        data: {
          chapterId: parseInt(chapterId),
          isCompleted: false,
          tasks: [],
          score: 0
        }
      });
    }

    const chapter = progress.chapters.find(ch => ch.chapterId === parseInt(chapterId));

    res.json({
      success: true,
      data: chapter || {
        chapterId: parseInt(chapterId),
        isCompleted: false,
        tasks: [],
        score: 0
      }
    });
  } catch (error) {
    console.error('获取章节进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取章节进度失败'
    });
  }
});

/**
 * 重置剧情进度
 * DELETE /api/story/:storyId/progress
 */
router.delete('/:storyId/progress', async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 删除用户进度
    await StoryProgress.deleteOne({ userId, storyId });

    res.json({
      success: true,
      message: '进度已重置'
    });
  } catch (error) {
    console.error('重置剧情进度失败:', error);
    res.status(500).json({
      success: false,
      message: '重置剧情进度失败'
    });
  }
});

module.exports = router;
