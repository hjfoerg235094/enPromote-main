// 复习计划API
const express = require('express');
const router = express.Router();
const UserWord = require('../modules/UserWord');
const User = require('../modules/User');
const { logger } = require('../utils/logger');
const { 
  getTodayReviewCount,
  getReviewSchedule 
} = require('../utils/spacedRepetition');

// 获取复习计划
router.get('/getReviewSchedule', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const user = await User.findById(userid);
        const curSence = req.query.chapter || user.currentChapter || 'A'; // 支持章节参数
        const days = parseInt(req.query.days) || 7; // 默认7天

        // 找出当前用户并符合场景和章节的单词
        const userWords = await UserWord
            .find({ userId: userid, sence: curSence })
            .sort({ priority: -1 });

        // 获取复习计划
        const schedule = getReviewSchedule(userWords, days);

        res.json({
            code: 200,
            data: {
                schedule,
                todayReviewCount: getTodayReviewCount(userWords),
                totalWordsToReview: userWords.length
            }
        });
    } catch (error) {
        logger.error('获取复习计划失败:', error);
        res.json({
            code: 500,
            message: '获取复习计划失败'
        });
    }
});

// 获取复习统计数据
router.get('/getReviewStats', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const user = await User.findById(userid);
        const curSence = req.query.chapter || user.currentChapter || 'A'; // 支持章节参数

        // 找出当前用户并符合场景和章节的单词
        const userWords = await UserWord.find({ userId: userid, sence: curSence });

        // 统计各状态单词数量
        const statusCounts = {
            unknown: 0,
            vague: 0,
            know: 0,
            mastered: 0
        };

        userWords.forEach(word => {
            if (statusCounts.hasOwnProperty(word.status)) {
                statusCounts[word.status]++;
            }
        });

        // 计算今日需要复习的单词数
        const todayReviewCount = getTodayReviewCount(userWords);

        // 计算本周需要复习的单词数
        const weekSchedule = getReviewSchedule(userWords, 7);
        const weekReviewCount = weekSchedule.reduce((sum, day) => sum + day.count, 0);

        // 计算复习效率
        const totalReviews = userWords.reduce((sum, word) => sum + word.reviewCounts, 0);
        const avgReviewsPerWord = userWords.length > 0 ? (totalReviews / userWords.length).toFixed(1) : 0;

        res.json({
            code: 200,
            data: {
                totalWords: userWords.length,
                statusCounts,
                todayReviewCount,
                weekReviewCount,
                avgReviewsPerWord: parseFloat(avgReviewsPerWord),
                totalReviews
            }
        });
    } catch (error) {
        logger.error('获取复习统计数据失败:', error);
        res.json({
            code: 500,
            message: '获取复习统计数据失败'
        });
    }
});

module.exports = router;
