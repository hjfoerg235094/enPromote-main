const express = require('express');
const router = express.Router();
const { StoryProgressManager } = require('../modules/StoryProgress');

/**
 * 记录用户表现数据
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/performance', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const userId = req.user?.id; // 假设从认证中间件获取用户ID
    const performanceData = req.body;

    // 验证必填字段
    if (!performanceData) {
      return res.status(400).json({
        success: false,
        message: '缺少表现数据'
      });
    }

    const result = await StoryProgressManager.recordPerformance(
      userId,
      storyId,
      chapterId,
      parseInt(taskId),
      performanceData
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('记录表现数据失败:', error);
    res.status(500).json({
      success: false,
      message: '记录表现数据失败',
      error: error.message
    });
  }
});

/**
 * 获取章节表现数据
 */
router.get('/:storyId/chapter/:chapterId/performance', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const userId = req.user?.id;

    const performance = await StoryProgressManager.getChapterPerformance(
      userId,
      storyId,
      parseInt(chapterId)
    );

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('获取章节表现数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取章节表现数据失败',
      error: error.message
    });
  }
});

/**
 * 调整章节难度
 */
router.post('/:storyId/chapter/:chapterId/adjust-difficulty', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const userId = req.user?.id;

    const adjustment = await StoryProgressManager.adjustDifficulty(
      userId,
      storyId,
      parseInt(chapterId)
    );

    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    console.error('调整难度失败:', error);
    res.status(500).json({
      success: false,
      message: '调整难度失败',
      error: error.message
    });
  }
});

/**
 * 保存关键选择
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/key-choice', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const userId = req.user?.id;
    const choiceData = req.body;

    // 验证必填字段
    if (!choiceData || !choiceData.choiceId || !choiceData.choiceText) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的选择数据'
      });
    }

    const result = await StoryProgressManager.saveKeyChoice(
      userId,
      storyId,
      parseInt(chapterId),
      parseInt(taskId),
      choiceData
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('保存关键选择失败:', error);
    res.status(500).json({
      success: false,
      message: '保存关键选择失败',
      error: error.message
    });
  }
});

/**
 * 获取历史关键选择
 */
router.get('/:storyId/chapter/:chapterId/key-choices', async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const userId = req.user?.id;

    const choices = await StoryProgressManager.getKeyChoices(
      userId,
      storyId,
      parseInt(chapterId)
    );

    res.json({
      success: true,
      data: choices
    });
  } catch (error) {
    console.error('获取历史关键选择失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史关键选择失败',
      error: error.message
    });
  }
});

/**
 * 获取用户偏好
 */
router.get('/:storyId/preferences', async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id;

    const preferences = await StoryProgressManager.getUserPreferences(
      userId,
      storyId
    );

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户偏好失败',
      error: error.message
    });
  }
});

/**
 * 更新用户偏好
 */
router.put('/:storyId/preferences', async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id;
    const preferences = req.body;

    const updatedPreferences = await StoryProgressManager.updateUserPreferences(
      userId,
      storyId,
      preferences
    );

    res.json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    console.error('更新用户偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户偏好失败',
      error: error.message
    });
  }
});

module.exports = router;
