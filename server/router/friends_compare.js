const express = require('express');
const router = express.Router();
const User = require('../modules/User');
const Friendship = require('../modules/Friendship');
const UserSettings = require('../modules/UserSettings');
const StudyRecord = require('../modules/StudyRecord');
const UserWord = require('../modules/UserWord');
const StoryProgressManager = require('../modules/StoryProgress');
const { logger, logApiError, logUserAction } = require('../utils/logger');

/**
 * 获取学习进度对比
 * GET /api/friends/compare/:friendId
 */
router.get('/compare/:friendId', async (req, res) => {
    try {
        const { userid } = req.session;
        const { friendId } = req.params;

        if (!friendId) {
            return res.json({
                code: 400,
                message: '好友ID不能为空'
            });
        }

        // 验证好友关系
        const friendship = await Friendship.findOne({
            userId: userid,
            friendId: friendId,
            status: 'accepted'
        });

        if (!friendship) {
            return res.json({
                code: 403,
                message: '只能查看好友的学习进度'
            });
        }

        // 获取用户设置，检查是否允许查看学习进度
        const [userSettings, friendSettings] = await Promise.all([
            UserSettings.findOne({ userId: userid }),
            UserSettings.findOne({ userId: friendId })
        ]);

        // 检查好友是否允许查看学习进度
        if (friendSettings && friendSettings.privacy.showProgressToFriends === false) {
            return res.json({
                code: 403,
                message: '该好友不允许查看学习进度'
            });
        }

        // 获取用户信息
        const [user, friend] = await Promise.all([
            User.findById(userid),
            User.findById(friendId)
        ]);

        if (!user || !friend) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        // 获取学习记录（最近30天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [userStudyRecords, friendStudyRecords] = await Promise.all([
            StudyRecord.find({
                userId: userid,
                date: { $gte: thirtyDaysAgo }
            }).sort({ date: 1 }),
            StudyRecord.find({
                userId: friendId,
                date: { $gte: thirtyDaysAgo }
            }).sort({ date: 1 })
        ]);

        // 计算学习时长对比
        const userTotalTime = userStudyRecords.reduce((sum, r) => sum + r.totalStudyTime, 0);
        const friendTotalTime = friendStudyRecords.reduce((sum, r) => sum + r.totalStudyTime, 0);
        const timeDifference = userTotalTime - friendTotalTime;

        // 计算单词掌握量对比
        const [userWordCount, friendWordCount] = await Promise.all([
            UserWord.countDocuments({ userId: userid }),
            UserWord.countDocuments({ userId: friendId })
        ]);
        const wordDifference = userWordCount - friendWordCount;

        // 获取剧情进度对比
        const [userStoryProgress, friendStoryProgress] = await Promise.all([
            StoryProgressManager.getAllUserProgress(userid),
            StoryProgressManager.getAllUserProgress(friendId)
        ]);

        // 计算连续学习天数对比
        const userStreakDays = user.cet4.streakDays || 0;
        const friendStreakDays = friend.cet4.streakDays || 0;
        const streakDifference = userStreakDays - friendStreakDays;

        // 组装对比数据
        const comparison = {
            studyTime: {
                user: {
                    totalMinutes: userTotalTime,
                    totalHours: Math.round(userTotalTime / 60 * 10) / 10,
                    dailyRecords: userStudyRecords.map(r => ({
                        date: r.date,
                        minutes: r.totalStudyTime
                    }))
                },
                friend: {
                    totalMinutes: friendTotalTime,
                    totalHours: Math.round(friendTotalTime / 60 * 10) / 10,
                    dailyRecords: friendStudyRecords.map(r => ({
                        date: r.date,
                        minutes: r.totalStudyTime
                    }))
                },
                difference: {
                    minutes: timeDifference,
                    hours: Math.round(timeDifference / 60 * 10) / 10,
                    isAhead: timeDifference > 0
                }
            },
            wordMastery: {
                user: {
                    totalWords: userWordCount
                },
                friend: {
                    totalWords: friendWordCount
                },
                difference: {
                    words: wordDifference,
                    isAhead: wordDifference > 0
                }
            },
            storyProgress: {
                user: {
                    stories: userStoryProgress.map(p => ({
                        storyId: p.storyId,
                        currentChapter: p.currentChapter,
                        completedChapters: p.completedChapters.length,
                        totalScore: p.totalScore
                    }))
                },
                friend: {
                    stories: friendStoryProgress.map(p => ({
                        storyId: p.storyId,
                        currentChapter: p.currentChapter,
                        completedChapters: p.completedChapters.length,
                        totalScore: p.totalScore
                    }))
                }
            },
            streakDays: {
                user: userStreakDays,
                friend: friendStreakDays,
                difference: {
                    days: streakDifference,
                    isAhead: streakDifference > 0
                }
            }
        };

        res.json({
            code: 200,
            message: 'success',
            data: comparison
        });
    } catch (error) {
        logger.error('获取学习进度对比失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取学习进度对比失败'
        });
    }
});

module.exports = router;
