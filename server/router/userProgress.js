const express = require('express');
const router = express.Router();
const StoryProgress = require('../models/StoryProgress');
const StudyRecord = require('../modules/StudyRecord');

/**
 * 获取用户总体学习进度
 * GET /api/user/progress
 */
router.get('/progress', async (req, res) => {
  try {
    const userId = req.session.userid;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }

    // 获取用户所有剧情进度
    const storyProgresses = await StoryProgress.find({ userId });

    // 计算已完成的章节数和任务数
    let completedChapters = 0;
    let completedTasks = 0;
    let currentChapter = null;

    storyProgresses.forEach(progress => {
      // 统计已完成的章节
      completedChapters += progress.chapters.filter(ch => ch.isCompleted).length;

      // 统计已完成的任务
      progress.chapters.forEach(chapter => {
        completedTasks += chapter.tasks.filter(t => t.isCompleted).length;
      });

      // 获取当前正在进行的章节
      if (!currentChapter && progress.currentChapterId) {
        const chapter = progress.chapters.find(ch => ch.chapterId === progress.currentChapterId);
        if (chapter) {
          currentChapter = {
            storyId: progress.storyId,
            chapterId: chapter.chapterId,
            title: `章节 ${chapter.chapterId}`,
            description: '继续学习当前章节',
            tasks: chapter.tasks.map(task => ({
              id: task.taskId,
              completed: task.isCompleted
            }))
          };
        }
      }
    });

    // 获取用户总学习时长（分钟）
    const studyRecords = await StudyRecord.find({ userId });
    const totalStudyTime = studyRecords.reduce((sum, record) => sum + (record.totalStudyTime || 0), 0);

    res.json({
      code: 200,
      message: '获取进度成功',
      data: {
        completedChapters,
        completedTasks,
        totalStudyTime,
        currentChapter
      }
    });
  } catch (error) {
    console.error('获取用户进度失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户进度失败'
    });
  }
});

module.exports = router;
