const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const studyRecordService = require('../services/studyRecordService');

/**
 * 记录词汇学习
 * POST /study-record/vocabulary
 */
router.post('/vocabulary', async (req, res) => {
  try {
    const { userId, date, studyTime, newWords, reviewWords } = req.body;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数: userId'
      });
    }

    const record = await studyRecordService.recordVocabularyStudy(
      userId,
      date || new Date(),
      studyTime || 0,
      newWords || 0,
      reviewWords || 0
    );

    res.json({
      code: 200,
      message: '记录成功',
      data: record
    });
  } catch (error) {
    logger.error('记录词汇学习失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录失败',
      error: error.message
    });
  }
});

/**
 * 记录听力练习
 * POST /study-record/listening
 */
router.post('/listening', async (req, res) => {
  try {
    const { userId, date, studyTime, completion } = req.body;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数: userId'
      });
    }

    const record = await studyRecordService.recordListeningPractice(
      userId,
      date || new Date(),
      studyTime || 0,
      completion || 0
    );

    res.json({
      code: 200,
      message: '记录成功',
      data: record
    });
  } catch (error) {
    logger.error('记录听力练习失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录失败',
      error: error.message
    });
  }
});

/**
 * 记录拼写练习
 * POST /study-record/spelling
 */
router.post('/spelling', async (req, res) => {
  try {
    const { userId, date, studyTime, accuracy } = req.body;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数: userId'
      });
    }

    const record = await studyRecordService.recordSpellingPractice(
      userId,
      date || new Date(),
      studyTime || 0,
      accuracy || 0
    );

    res.json({
      code: 200,
      message: '记录成功',
      data: record
    });
  } catch (error) {
    logger.error('记录拼写练习失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录失败',
      error: error.message
    });
  }
});

/**
 * 记录AI练习
 * POST /study-record/ai-practice
 */
router.post('/ai-practice', async (req, res) => {
  try {
    const { userId, date, studyTime, count } = req.body;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数: userId'
      });
    }

    const record = await studyRecordService.recordAIPractice(
      userId,
      date || new Date(),
      studyTime || 0,
      count || 0
    );

    res.json({
      code: 200,
      message: '记录成功',
      data: record
    });
  } catch (error) {
    logger.error('记录AI练习失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录失败',
      error: error.message
    });
  }
});

module.exports = router;
