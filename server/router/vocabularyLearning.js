
const express = require('express');
const router = express.Router();
const vocabularyLearningService = require('../services/vocabularyLearningService');
const { logger, logUserAction, logApiError } = require('../utils/logger');

/**
 * 获取用户学习进度
 * GET /api/vocabulary-learning/progress
 */
router.get('/progress', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const progress = await vocabularyLearningService.getUserLearningProgress(userid);

        logUserAction(req, 'GET_LEARNING_PROGRESS', { userId: userid });

        res.json({
            code: 200,
            data: progress
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '获取学习进度失败',
            error: error.message
        });
    }
});

/**
 * 获取学习单词列表
 * GET /api/vocabulary-learning/words
 * Query参数:
 * - chapter: 章节字母 (A-Z)
 * - startIndex: 起始索引 (默认0)
 * - count: 单词数量 (默认20)
 */
router.get('/words', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { chapter = 'A', startIndex = 0, count = 20 } = req.query;

        const result = await vocabularyLearningService.getLearningWords(
            userid,
            chapter,
            parseInt(startIndex),
            parseInt(count)
        );

        logUserAction(req, 'GET_LEARNING_WORDS', { 
            userId: userid, 
            chapter, 
            startIndex, 
            count 
        });

        res.json({
            code: 200,
            data: result
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '获取学习单词列表失败',
            error: error.message
        });
    }
});

/**
 * 更新学习进度
 * POST /api/vocabulary-learning/progress
 * Body: { studiedWords: number, chapter: string, newIndex: number }
 */
router.post('/progress', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { studiedWords, chapter, newIndex } = req.body;

        if (!studiedWords || !chapter || newIndex === undefined) {
            return res.json({
                code: 400,
                message: '参数不完整'
            });
        }

        const progress = await vocabularyLearningService.updateLearningProgress(
            userid,
            parseInt(studiedWords),
            chapter,
            parseInt(newIndex)
        );

        logUserAction(req, 'UPDATE_LEARNING_PROGRESS', { 
            userId: userid, 
            studiedWords, 
            chapter, 
            newIndex 
        });

        res.json({
            code: 200,
            message: '更新成功',
            data: progress
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '更新学习进度失败',
            error: error.message
        });
    }
});

/**
 * 记录单词学习结果
 * POST /api/vocabulary-learning/word
 * Body: { word: string, status: string }
 */
router.post('/word', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { word, status } = req.body;

        if (!word || !status) {
            return res.json({
                code: 400,
                message: '参数不完整'
            });
        }

        const result = await vocabularyLearningService.recordWordLearning(userid, word, status);

        logUserAction(req, 'RECORD_WORD_LEARNING', { 
            userId: userid, 
            word, 
            status 
        });

        res.json({
            code: 200,
            message: '记录成功',
            data: result
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '记录单词学习结果失败',
            error: error.message
        });
    }
});

/**
 * 批量记录单词学习结果
 * POST /api/vocabulary-learning/words/batch
 * Body: { words: [{ word: string, status: string }] }
 */
router.post('/words/batch', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { words } = req.body;

        if (!Array.isArray(words) || words.length === 0) {
            return res.json({
                code: 400,
                message: '参数不完整'
            });
        }

        const results = await Promise.all(
            words.map(({ word, status }) => 
                vocabularyLearningService.recordWordLearning(userid, word, status)
            )
        );

        logUserAction(req, 'BATCH_RECORD_WORD_LEARNING', { 
            userId: userid, 
            count: words.length 
        });

        res.json({
            code: 200,
            message: '批量记录成功',
            data: results
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '批量记录单词学习结果失败',
            error: error.message
        });
    }
});

/**
 * 获取需要复习的单词
 * GET /api/vocabulary-learning/review
 * Query参数:
 * - limit: 返回数量限制 (默认20)
 */
router.get('/review', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { limit = 20 } = req.query;

        const words = await vocabularyLearningService.getReviewWords(
            userid,
            parseInt(limit)
        );

        logUserAction(req, 'GET_REVIEW_WORDS', { 
            userId: userid, 
            limit,
            count: words.length 
        });

        res.json({
            code: 200,
            data: {
                words,
                count: words.length
            }
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '获取复习单词失败',
            error: error.message
        });
    }
});

/**
 * 切换到下一章节
 * POST /api/vocabulary-learning/next-chapter
 */
router.post('/next-chapter', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const result = await vocabularyLearningService.moveToNextChapter(userid);

        logUserAction(req, 'MOVE_TO_NEXT_CHAPTER', { 
            userId: userid,
            ...result
        });

        res.json({
            code: 200,
            message: '切换成功',
            data: result
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '切换章节失败',
            error: error.message
        });
    }
});

/**
 * 获取学习统计
 * GET /api/vocabulary-learning/statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const progress = await vocabularyLearningService.getUserLearningProgress(userid);

        // 计算学习统计
        const statistics = {
            totalLearned: progress.totalLearned,
            todayLearned: progress.todayLearned,
            streakDays: progress.streakDays,
            chapterProgress: {
                currentChapter: progress.currentChapter,
                currentIndex: progress.currentIndex,
                totalWords: progress.chapterTotal,
                percentage: progress.chapterProgress
            },
            lastStudyDate: progress.lastStudyDate
        };

        logUserAction(req, 'GET_LEARNING_STATISTICS', { userId: userid });

        res.json({
            code: 200,
            data: statistics
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '获取学习统计失败',
            error: error.message
        });
    }
});

module.exports = router;
