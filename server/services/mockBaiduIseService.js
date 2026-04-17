/**
 * 模拟百度语音口语评测服务
 * 用于开发和测试阶段，替代真实的百度API
 */

const { logger } = require('../utils/logger');

class MockBaiduIseService {
  constructor() {
    this.accessToken = 'mock_access_token_for_testing';
    this.tokenExpireTime = Date.now() + 2592000000; // 30天后过期
  }

  /**
   * 获取访问令牌（模拟）
   * @returns {Promise<string>} 访问令牌
   */
  async getAccessToken() {
    // 模拟API调用延迟
    await this.simulateDelay(500);

    // 检查token是否过期（提前5分钟刷新）
    if (this.accessToken && Date.now() < this.tokenExpireTime - 300000) {
      return this.accessToken;
    }

    this.accessToken = 'mock_access_token_' + Date.now();
    this.tokenExpireTime = Date.now() + 2592000000;

    logger.info('模拟百度访问令牌获取成功');
    return this.accessToken;
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
      format = 'wav',  // 音频格式
      rate = 16000     // 采样率
    } = options;

    try {
      // 模拟API调用延迟
      await this.simulateDelay(1000 + Math.random() * 500);

      // 验证音频数据
      if (!audioData || audioData.length === 0) {
        throw new Error('音频数据为空');
      }

      logger.info(`模拟评测 - 文本: "${text}", 类型: ${category}, 等级: ${level}`);

      // 生成模拟评测结果
      return this.generateMockResult(text, category, level);
    } catch (error) {
      logger.error('模拟百度口语评测失败:', error);
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
        word: word,
        score: score,
        begin_time: index * 600,
        end_time: index * 600 + duration,
        phonemes: this.generatePhonemeScores(word)
      };
    });

    // 计算各维度评分
    const overallScore = this.calculateAverage(wordDetails.map(w => w.score));
    const accuracy = this.generateRandomScore(70, 95);
    const fluency = this.generateRandomScore(70, 95);
    const integrity = this.generateRandomScore(80, 98);
    const pronunciation = this.generateRandomScore(70, 95);
    const speed = this.generateRandomScore(70, 95);
    const intonation = this.generateRandomScore(70, 95);

    // 构建百度API格式的响应
    const baiduResponse = {
      err_no: 0,
      err_msg: 'success',
      result: [{
        total_score: overallScore,
        accuracy_score: accuracy,
        fluency_score: fluency,
        integrity_score: integrity,
        pronunciation_score: pronunciation,
        words: wordDetails
      }]
    };

    // 解析为统一格式
    return this.parseResult(baiduResponse);
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
        phoneme: letter,
        score: this.generateRandomScore(75, 98),
        begin_time: index * 100,
        end_time: (index + 1) * 100
      });
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
   * 解析评测结果
   * @param {Object} data - 原始评测数据
   * @returns {Object} 解析后的结果
   */
  parseResult(data) {
    try {
      // 百度返回的数据结构
      const result = data.result || [];

      // 如果没有结果，返回默认值
      if (result.length === 0) {
        return this.getDefaultResult();
      }

      // 解析第一个结果（通常只有一个）
      const firstResult = result[0];

      // 提取评分
      const overallScore = parseFloat(firstResult.total_score) || 0;

      // 提取各维度评分
      const accuracy = parseFloat(firstResult.accuracy_score) || 0;
      const fluency = parseFloat(firstResult.fluency_score) || 0;
      const integrity = parseFloat(firstResult.integrity_score) || 0;
      const pronunciation = parseFloat(firstResult.pronunciation_score) || 0;

      // 提取单词级别的详细信息
      const words = [];
      const phonemes = [];

      if (firstResult.words) {
        firstResult.words.forEach(word => {
          const startTime = word.begin_time || 0;
          const endTime = word.end_time || 0;
          words.push({
            text: word.word,  // 使用text而不是word，匹配前端接口
            score: parseFloat(word.score) || 0,
            timeLen: endTime - startTime  // 添加timeLen属性
          });

          // 提取音素信息
          if (word.phonemes) {
            word.phonemes.forEach(phoneme => {
              phonemes.push({
                text: phoneme.phoneme,  // 使用text而不是phoneme
                score: parseFloat(phoneme.score) || 0
              });
            });
          }
        });
      }

      return {
        // 总体评分
        overallScore: Math.round(overallScore),

        // 维度评分
        dimensions: {
          accuracy: Math.round(accuracy),
          fluency: Math.round(fluency),
          integrity: Math.round(integrity),
          pronunciation: Math.round(pronunciation),
          speed: this.calculateSpeed(data),
          intonation: this.calculateIntonation(data)
        },

        // 详细信息
        details: {
          words: words,
          phonemes: phonemes
        },

        // 原始数据
        raw: JSON.stringify(data)
      };
    } catch (error) {
      logger.error('解析评测结果失败:', error);
      return this.getDefaultResult();
    }
  }

  /**
   * 获取默认结果
   * @returns {Object} 默认结果
   */
  getDefaultResult() {
    return {
      overallScore: 0,
      dimensions: {
        accuracy: 0,
        fluency: 0,
        integrity: 0,
        pronunciation: 0,
        speed: 0,
        intonation: 0
      },
      details: {
        words: [],
        phonemes: []
      },
      raw: null
    };
  }

  /**
   * 计算语速评分
   * @param {Object} data - 原始评测数据
   * @returns {number} 语速评分 (0-100)
   */
  calculateSpeed(data) {
    try {
      const result = data.result && data.result[0];
      if (!result || !result.words) {
        return 0;
      }

      // 计算总时长（毫秒）
      const totalTime = result.words.reduce((sum, word) => {
        return sum + ((word.end_time || 0) - (word.begin_time || 0));
      }, 0);

      const totalWords = result.words.length;

      if (totalTime > 0 && totalWords > 0) {
        // 计算每分钟词数 (WPM)
        const wpm = (totalWords / totalTime) * 60000;

        // 根据WPM计算评分
        // 正常英语语速约为 120-160 WPM
        if (wpm >= 120 && wpm <= 160) {
          return 90 + Math.min(10, (160 - Math.abs(wpm - 140)) / 2);
        } else if (wpm >= 100 && wpm < 120) {
          return 70 + (wpm - 100) / 20 * 20;
        } else if (wpm > 160 && wpm <= 180) {
          return 70 + (180 - wpm) / 20 * 20;
        } else if (wpm >= 80 && wpm < 100) {
          return 50 + (wpm - 80) / 20 * 20;
        } else if (wpm > 180 && wpm <= 200) {
          return 50 + (200 - wpm) / 20 * 20;
        } else {
          return Math.max(0, 50 - Math.abs(wpm - 140) / 10);
        }
      }
      return 0;
    } catch (error) {
      logger.error('计算语速评分失败:', error);
      return 0;
    }
  }

  /**
   * 计算声调/语调评分
   * @param {Object} data - 原始评测数据
   * @returns {number} 声调/语调评分 (0-100)
   */
  calculateIntonation(data) {
    try {
      const result = data.result && data.result[0];
      if (!result || !result.words) {
        return 0;
      }

      // 基于单词评分计算语调
      let totalWordScore = 0;
      let wordCount = 0;

      result.words.forEach(word => {
        if (word.score !== undefined) {
          totalWordScore += parseFloat(word.score) || 0;
          wordCount++;
        }
      });

      if (wordCount > 0) {
        const avgWordScore = totalWordScore / wordCount;
        // 语调评分基于单词评分，并考虑句子结构
        const sentenceVariation = Math.min(1, result.words.length / 3);
        return Math.round(avgWordScore * (0.7 + 0.3 * sentenceVariation));
      }
      return 0;
    } catch (error) {
      logger.error('计算语调评分失败:', error);
      return 0;
    }
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
      pronunciation: '',
      speed: '',
      intonation: ''
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

    // 语速建议
    if (dimensions.speed >= 80) {
      advice.speed = '语速适中，表达流畅';
    } else if (dimensions.speed >= 60) {
      advice.speed = '语速基本合适，可以适当调整';
    } else {
      advice.speed = '语速需要调整，建议多练习';
    }

    // 语调建议
    if (dimensions.intonation >= 80) {
      advice.intonation = '语调自然，抑扬顿挫';
    } else if (dimensions.intonation >= 60) {
      advice.intonation = '语调基本自然，可以更加生动';
    } else {
      advice.intonation = '需要加强语调练习';
    }

    return advice;
  }
}

module.exports = new MockBaiduIseService();
