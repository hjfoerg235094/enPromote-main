/**
 * 模拟科大讯飞语音口语评测服务
 * 用于开发和测试阶段，替代真实的科大讯飞API
 */

const { logger } = require('../utils/logger');

class MockXunfeiIseService {
  constructor() {
    this.appId = 'mock_app_id_for_testing';
  }

  /**
   * 执行口语评测（模拟）
   * @param {Object} options - 评测参数
   * @param {Buffer} audioData - 音频数据
   * @returns {Promise<Object>} 评测结果
   */
  async evaluate(options, audioData) {
    const {
      text,           // 待评测文本
      category = 'sentence',  // 评测类型: word/sentence/paragraph
      level = 'senior',     // 评测等级: primary/junior/senior/college
      format = 'audio/L16;rate=16000',  // 音频格式
      encoding = 'raw' // 音频编码
    } = options;

    try {
      // 模拟API调用延迟
      await this.simulateDelay(1000 + Math.random() * 500);

      // 验证音频数据
      if (!audioData || audioData.length === 0) {
        throw new Error('音频数据为空');
      }

      logger.info(`模拟科大讯飞评测 - 文本: "${text}", 类型: ${category}, 等级: ${level}`);

      // 生成模拟评测结果
      return this.generateMockResult(text, category, level);
    } catch (error) {
      logger.error('模拟科大讯飞口语评测失败:', error);
      throw error;
    }
  }

  /**
   * 生成模拟评测结果
   * @param {string} text - 评测文本
   * @param {string} category - 评测类型
   * @param {string} level - 评测等级
   * @returns {Object} 模拟的评测结果
   */
  generateMockResult(text, category, level) {
    // 将文本分割成单词
    const words = text.split(/\s+/).filter(word => word.length > 0);

    // 生成每个单词的评分
    const wordDetails = words.map((word, index) => {
      const score = this.generateRandomScore(70, 95);
      const duration = 300 + Math.random() * 400; // 每个单词300-700ms

      return {
        text: word,
        score: score,
        timeLen: duration,
        phonemes: this.generatePhonemeScores(word)
      };
    });

    // 计算各维度评分
    const overallScore = this.calculateAverage(wordDetails.map(w => w.score));
    const accuracy = this.generateRandomScore(70, 95);
    const fluency = this.generateRandomScore(70, 95);
    const integrity = this.generateRandomScore(80, 98);
    const pronunciation = this.generateRandomScore(70, 95);

    return {
      // 总体评分
      overallScore: Math.round(overallScore),

      // 维度评分
      dimensions: {
        accuracy: Math.round(accuracy),
        fluency: Math.round(fluency),
        integrity: Math.round(integrity),
        pronunciation: Math.round(pronunciation)
      },

      // 详细信息
      details: {
        words: wordDetails,
        phonemes: this.extractPhonemes(wordDetails)
      }
    };
  }

  /**
   * 生成音素级别的评分
   * @param {string} word - 单词
   * @returns {Array} 音素评分数组
   */
  generatePhonemeScores(word) {
    const phonemes = [];
    const letters = word.split('');

    letters.forEach((letter, index) => {
      phonemes.push({
        text: letter,
        score: this.generateRandomScore(75, 98)
      });
    });

    return phonemes;
  }

  /**
   * 从单词详情中提取所有音素
   * @param {Array} wordDetails - 单词详情数组
   * @returns {Array} 音素数组
   */
  extractPhonemes(wordDetails) {
    const phonemes = [];
    wordDetails.forEach(word => {
      if (word.phonemes) {
        phonemes.push(...word.phonemes);
      }
    });
    return phonemes;
  }

  /**
   * 生成随机评分
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {number} 随机评分
   */
  generateRandomScore(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 计算平均值
   * @param {Array} values - 数值数组
   * @returns {number} 平均值
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }

  /**
   * 模拟网络延迟
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} 延迟Promise
   */
  simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成评测建议
   * @param {Object} result - 评测结果
   * @returns {Object} 评测建议
   */
  generateAdvice(result) {
    const { overallScore, dimensions } = result;
    const advice = {
      overall: '',
      accuracy: '',
      fluency: '',
      integrity: '',
      pronunciation: ''
    };

    // 总体建议
    if (overallScore >= 90) {
      advice.overall = '发音非常标准，继续保持！';
    } else if (overallScore >= 80) {
      advice.overall = '发音良好，还有提升空间';
    } else if (overallScore >= 60) {
      advice.overall = '发音基本正确，需要加强练习';
    } else {
      advice.overall = '发音需要改进，请多听多练';
    }

    // 准确度建议
    if (dimensions.accuracy >= 80) {
      advice.accuracy = '发音准确度很好';
    } else if (dimensions.accuracy >= 60) {
      advice.accuracy = '注意一些单词的发音细节';
    } else {
      advice.accuracy = '需要加强单词发音的准确性';
    }

    // 流利度建议
    if (dimensions.fluency >= 80) {
      advice.fluency = '流利度很好，语速适中';
    } else if (dimensions.fluency >= 60) {
      advice.fluency = '注意语速和停顿';
    } else {
      advice.fluency = '需要提高流利度，多练习';
    }

    // 完整度建议
    if (dimensions.integrity >= 80) {
      advice.integrity = '朗读完整，没有遗漏';
    } else if (dimensions.integrity >= 60) {
      advice.integrity = '注意不要遗漏单词';
    } else {
      advice.integrity = '需要提高朗读的完整性';
    }

    // 发音建议
    if (dimensions.pronunciation >= 80) {
      advice.pronunciation = '发音标准，语音语调自然';
    } else if (dimensions.pronunciation >= 60) {
      advice.pronunciation = '注意语音语调的准确性';
    } else {
      advice.pronunciation = '需要加强发音练习';
    }

    return advice;
  }
}

module.exports = new MockXunfeiIseService();
