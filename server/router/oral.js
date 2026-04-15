
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xunfeiIseService = require('../services/xunfeiIseService');
const { logger } = require('../utils/logger');

// 配置音频文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许音频文件
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传音频文件'));
    }
  }
});

/**
 * 口语评测接口
 * POST /api/oral/evaluate
 * 
 * 请求参数:
 * - audio: 音频文件 (form-data)
 * - text: 待评测文本
 * - category: 评测类型 (word/sentence/paragraph/free)
 * - level: 评测等级 (primary/junior/senior/college)
 * 
 * 返回结果:
 * - overallScore: 总体评分 (0-100)
 * - dimensions: 维度评分 (accuracy/fluency/integrity/pronunciation)
 * - details: 详细信息 (words/phonemes)
 * - advice: 评测建议
 */
router.post('/evaluate', upload.single('audio'), async (req, res) => {
  try {
    const { text, category = 'sentence', level = 'senior' } = req.body;

    // 参数验证
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传音频文件'
      });
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '请提供待评测文本'
      });
    }

    // 执行评测
    const result = await xunfeiIseService.evaluate(
      {
        text,
        category,
        level
      },
      req.file.buffer
    );

    // 生成评测建议
    const advice = xunfeiIseService.generateAdvice(result);

    // 返回结果
    res.json({
      success: true,
      data: {
        ...result,
        advice
      }
    });

  } catch (error) {
    logger.error('口语评测失败:', error);
    res.status(500).json({
      success: false,
      message: '评测失败: ' + error.message
    });
  }
});

/**
 * 批量口语评测接口
 * POST /api/oral/batch-evaluate
 * 
 * 请求参数:
 * - audio: 音频文件 (form-data)
 * - texts: 待评测文本数组
 * - category: 评测类型
 * - level: 评测等级
 * 
 * 返回结果:
 * - results: 评测结果数组
 */
router.post('/batch-evaluate', upload.single('audio'), async (req, res) => {
  try {
    let { texts, category = 'sentence', level = 'senior' } = req.body;

    // 前端可能会把 texts 以 JSON 字符串形式传过来，这里做兼容解析
    if (typeof texts === 'string') {
      try {
        texts = JSON.parse(texts);
      } catch (e) {
        // 保留原值，后面由校验逻辑兜底返回 400
      }
    }

    // 参数验证
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传音频文件'
      });
    }

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供待评测文本数组'
      });
    }

    // 执行批量评测
    const results = await Promise.all(
      texts.map(text =>
        xunfeiIseService.evaluate(
          {
            text,
            category,
            level
          },
          req.file.buffer
        )
      )
    );

    // 为每个结果生成建议
    const resultsWithAdvice = results.map(result => ({
      ...result,
      advice: xunfeiIseService.generateAdvice(result)
    }));

    // 返回结果
    res.json({
      success: true,
      data: resultsWithAdvice
    });

  } catch (error) {
    logger.error('批量口语评测失败:', error);
    res.status(500).json({
      success: false,
      message: '批量评测失败: ' + error.message
    });
  }
});

/**
 * 获取评测配置
 * GET /api/oral/config
 * 
 * 返回结果:
 * - categories: 支持的评测类型
 * - levels: 支持的评测等级
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      categories: {
        word: '单词评测',
        sentence: '句子评测',
        paragraph: '段落评测',
        free: '自由说'
      },
      levels: {
        primary: '小学',
        junior: '初中',
        senior: '高中',
        college: '大学'
      }
    }
  });
});

module.exports = router;
