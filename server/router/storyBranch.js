
const express = require('express');
const router = express.Router();
const { StoryBranchManager } = require('../modules/StoryBranch');

/**
 * 获取任务的所有选择分支
 */
router.get('/:storyId/chapter/:chapterId/task/:taskId/branches', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const branches = await StoryBranchManager.getBranches(
      storyId,
      parseInt(chapterId),
      parseInt(taskId)
    );

    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('获取任务分支失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务分支失败'
    });
  }
});

/**
 * 根据用户选择和表现确定下一章
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/next-chapter', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const { choiceId, performance } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const result = await StoryBranchManager.determineNextChapter(
      userId,
      storyId,
      parseInt(chapterId),
      parseInt(taskId),
      choiceId,
      performance
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('确定下一章失败:', error);
    res.status(500).json({
      success: false,
      message: '确定下一章失败'
    });
  }
});

/**
 * 获取剧情结局
 */
router.get('/:storyId/ending', async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const ending = await StoryBranchManager.getEnding(userId, storyId);

    res.json({
      success: true,
      data: ending
    });
  } catch (error) {
    console.error('获取剧情结局失败:', error);
    res.status(500).json({
      success: false,
      message: '获取剧情结局失败'
    });
  }
});

/**
 * 获取剧情树数据
 */
router.get('/:storyId/tree', async (req, res) => {
  try {
    const { storyId } = req.params;
    const tree = await StoryBranchManager.getStoryTree(storyId);

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('获取剧情树失败:', error);
    res.status(500).json({
      success: false,
      message: '获取剧情树失败'
    });
  }
});

/**
 * 创建剧情分支（管理员功能）
 */
router.post('/branches', async (req, res) => {
  try {
    const branchData = req.body;
    const branch = await StoryBranchManager.createBranch(branchData);

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('创建剧情分支失败:', error);
    res.status(500).json({
      success: false,
      message: '创建剧情分支失败'
    });
  }
});

/**
 * 创建剧情结局（管理员功能）
 */
router.post('/endings', async (req, res) => {
  try {
    const endingData = req.body;
    const ending = await StoryBranchManager.createEnding(endingData);

    res.json({
      success: true,
      data: ending
    });
  } catch (error) {
    console.error('创建剧情结局失败:', error);
    res.status(500).json({
      success: false,
      message: '创建剧情结局失败'
    });
  }
});

module.exports = router;
