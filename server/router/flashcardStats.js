const express = require('express');
const router = express.Router();
const User = require('../modules/User');
const Word = require('../modules/Word');
const UserWord = require('../modules/UserWord');
const { logUserAction, logApiError } = require('../utils/logger');

// 获取用户学习统计数据
router.get('/getUserStats', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const user = await User.findById(userid);
    if (!user) {
      return res.json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 计算学习统计数据
    const totalWords = user.totalWords || 0;
    const streakDays = user.streakDays || 0;
    
    // 获取最近的学习历史
    const recentStudyHistory = user.studyHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7); // 最近7天
    
    // 计算掌握的单词数量
    const masteredWords = await UserWord.countDocuments({
      userId: userid,
      status: 'know'
    });
    
    // 计算总体掌握率
    const totalLearnedWords = await UserWord.countDocuments({ userId: userid });
    const overallMasteryRate = totalLearnedWords > 0 
      ? Math.round((masteredWords / totalLearnedWords) * 100) 
      : 0;

    const stats = {
      totalWords,
      streakDays,
      masteredWords,
      totalLearnedWords,
      overallMasteryRate,
      recentStudyHistory,
      dailyGoal: user.dailyGoal || 20 // 默认每日目标20个单词
    };

    logUserAction(req, 'GET_USER_STATS', { userId: userid });

    res.json({
      code: 200,
      data: stats,
      message: '获取统计数据成功'
    });
  } catch (error) {
    logApiError(req, error, 500);
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

module.exports = router;