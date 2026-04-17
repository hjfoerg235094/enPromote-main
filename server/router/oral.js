
const express = require('express');
const router = express.Router();
const multer = require('multer');
const xunfeiIseService = require('../services/xunfeiIseService');
const mockXunfeiIseService = require('../services/mockXunfeiIseService');
const { logger } = require('../utils/logger');

// 根据环境变量决定使用真实API还是模拟服务
const USE_MOCK_ISE = process.env.USE_MOCK_ISE === 'true';
const iseService = USE_MOCK_ISE ? mockXunfeiIseService : xunfeiIseService;

logger.info(`口语评测服务模式: ${USE_MOCK_ISE ? '模拟模式' : '真实API模式(科大讯飞)'}`);

// 配置音频文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许音频文件，包括PCM格式
    if (file.mimetype.startsWith('audio/') || 
        file.mimetype === 'application/octet-stream' ||
        file.originalname.endsWith('.pcm') ||
        file.originalname.endsWith('.wav') ||
        file.originalname.endsWith('.webm')) {
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

    // 添加详细日志
    logger.info('收到评测请求', {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimetype: req.file?.mimetype,
      text,
      category,
      level
    });

    // 参数验证
    if (!req.file) {
      logger.warn('未上传音频文件');
      return res.status(400).json({
        success: false,
        message: '请上传音频文件'
      });
    }

    if (!text) {
      logger.warn('未提供待评测文本');
      return res.status(400).json({
        success: false,
        message: '请提供待评测文本'
      });
    }

    // 执行评测
    const result = await iseService.evaluate(
      {
        text,
        category,
        level
      },
      req.file.buffer
    );

    // 生成评测建议
    const advice = iseService.generateAdvice(result);

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
        iseService.evaluate(
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
      advice: iseService.generateAdvice(result)
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
