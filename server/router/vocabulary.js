
const express = require('express');
const router = express.Router();
const vocabularyService = require('../services/vocabularyService');
const User = require('../modules/User');
const UserWord = require('../modules/UserWord');
const { logger, logUserAction, logApiError } = require('../utils/logger');

/**
 * 获取单词列表
 * GET /api/vocabulary/words
 * Query参数:
 * - level: 词汇等级 (CET-4, CET-6, PEE等)
 * - chapter: 章节字母 (A-Z)
 * - start: 起始索引 (默认0)
 * - limit: 返回数量限制 (默认20)
 */
router.get('/words', async (req, res) => {
    try {
        const { level = 'CET-4', chapter, start = 0, limit = 20 } = req.query;

        if (!chapter) {
            return res.json({
                code: 400,
                message: '请指定章节'
            });
        }

        const result = await vocabularyService.getWordsByChapter(level, chapter, parseInt(start), parseInt(limit));

        logUserAction(req, 'GET_WORDS', { level, chapter, start, limit });

        res.json({
            code: 200,
            data: result
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '获取单词列表失败',
            error: error.message
        });
    }
});

/**
 * 获取单词详细信息
 * GET /api/vocabulary/word/:word
 */
router.get('/word/:word', async (req, res) => {
    try {
        const { word } = req.params;
        const wordDetail = await vocabularyService.getWordDetail(word);

        if (!wordDetail) {
            return res.json({
                code: 404,
                message: '单词不存在'
            });
        }

        logUserAction(req, 'GET_WORD_DETAIL', { word });

        res.json({
            code: 200,
            data: wordDetail
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '获取单词详情失败',
            error: error.message
        });
    }
});

/**
 * 批量获取单词详细信息
 * POST /api/vocabulary/words/batch
 * Body: { words: ["word1", "word2", ...] }
 */
router.post('/words/batch', async (req, res) => {
    try {
        const { words } = req.body;

        if (!Array.isArray(words) || words.length === 0) {
            return res.json({
                code: 400,
                message: '请提供单词数组'
            });
        }

        const wordsDetail = await vocabularyService.getWordsDetail(words);

        logUserAction(req, 'GET_WORDS_BATCH', { count: words.length });

        res.json({
            code: 200,
            data: wordsDetail
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '批量获取单词详情失败',
            error: error.message
        });
    }
});

/**
 * 搜索单词
 * GET /api/vocabulary/search
 * Query参数:
 * - keyword: 搜索关键词
 * - level: 词汇等级 (默认CET-4)
 */
router.get('/search', async (req, res) => {
    try {
        const { keyword, level = 'CET-4' } = req.query;

        if (!keyword) {
            return res.json({
                code: 400,
                message: '请提供搜索关键词'
            });
        }

        const results = await vocabularyService.searchWords(keyword, level);

        logUserAction(req, 'SEARCH_WORDS', { keyword, level, count: results.length });

        res.json({
            code: 200,
            data: {
                keyword,
                level,
                results,
                count: results.length
            }
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '搜索单词失败',
            error: error.message
        });
    }
});

/**
 * 获取用户学习进度
 * GET /api/vocabulary/progress
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

        const progress = await vocabularyService.getUserProgress(userid);

        logUserAction(req, 'GET_PROGRESS', { userId: userid });

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
 * 更新用户单词学习状态
 * POST /api/vocabulary/word/status
 * Body: { wordId: string, status: string, isCorrect: boolean }
 */
router.post('/word/status', async (req, res) => {
    try {
        const userid = req.session.userid;

        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { wordId, status, isCorrect } = req.body;

        if (!wordId) {
            return res.json({
                code: 400,
                message: '请提供单词ID'
            });
        }

        // 查找或创建用户单词记录
        let userWord = await UserWord.findOne({ userId: userid, wordId });

        if (!userWord) {
            userWord = new UserWord({
                userId: userid,
                wordId: wordId,
                status: status || 'new',
                reviewCounts: 1,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
                nextReviewTime: new Date(Date.now() + 30 * 60 * 1000) // 30分钟后
            });
        } else {
            userWord.status = status || userWord.status;
            userWord.reviewCounts = (userWord.reviewCounts || 0) + 1;
            userWord.lastSeenAt = new Date();

            // 根据答题情况调整下次复习时间
            if (isCorrect) {
                const interval = Math.min(2 ** userWord.reviewCounts, 30); // 最多30天
                userWord.nextReviewTime = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
            } else {
                userWord.nextReviewTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1天后
            }
        }

        await userWord.save();

        logUserAction(req, 'UPDATE_WORD_STATUS', { 
            userId: userid, 
            wordId, 
            status, 
            isCorrect 
        });

        res.json({
            code: 200,
            message: '更新成功',
            data: userWord
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '更新单词状态失败',
            error: error.message
        });
    }
});

/**
 * 获取需要复习的单词
 * GET /api/vocabulary/review
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

        const now = new Date();
        const reviewWords = await UserWord.find({
            userId: userid,
            nextReviewTime: { $lte: now }
        })
        .sort({ nextReviewTime: 1 })
        .limit(20);

        // 获取单词详细信息
        const wordIds = reviewWords.map(item => item.wordId);
        const Word = require('../modules/Word');
        const words = await Word.find({ _id: { $in: wordIds } });

        // 创建单词ID到单词对象的映射
        const wordMap = new Map(words.map(word => [word._id.toString(), word]));

        // 格式化返回数据
        const formattedWords = reviewWords.map(item => {
            const word = wordMap.get(item.wordId);
            return {
                id: item._id,
                wordId: item.wordId,
                word: word ? word.word : '',
                meaning: word ? word.chineseMeaning : '',
                status: item.status,
                reviewCounts: item.reviewCounts,
                nextReviewTime: item.nextReviewTime
            };
        });

        logUserAction(req, 'GET_REVIEW_WORDS', { 
            userId: userid, 
            count: formattedWords.length 
        });

        res.json({
            code: 200,
            data: {
                words: formattedWords,
                count: formattedWords.length
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
 * 清除词汇缓存
 * POST /api/vocabulary/cache/clear
 * Body: { level?: string } // 可选，指定要清除的词汇等级
 */
router.post('/cache/clear', async (req, res) => {
    try {
        const { level } = req.body;
        vocabularyService.clearCache(level);

        logUserAction(req, 'CLEAR_CACHE', { level });

        res.json({
            code: 200,
            message: '缓存清除成功'
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.status(500).json({
            code: 500,
            message: '清除缓存失败',
            error: error.message
        });
    }
});

module.exports = router;
