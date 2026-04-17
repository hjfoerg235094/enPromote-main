const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const baiduConfig = require('../config/baidu');
const { logger } = require('../utils/logger');

/**
 * 百度语音口语评测服务
 */
class BaiduIseService {
  constructor() {
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  /**
   * 获取访问令牌
   * @returns {Promise<string>} 访问令牌
   */
async getAccessToken() {
  // 检查token是否过期（提前5分钟刷新）
  if (this.accessToken && Date.now() < this.tokenExpireTime - 300000) {
    return this.accessToken;
  }

  return new Promise((resolve, reject) => {
    const { apiKey, secretKey } = baiduConfig;
    
    logger.info('百度API配置检查:');
    logger.info('- API Key:', apiKey ? apiKey.substring(0, 8) + '...' : '未设置');
    logger.info('- Secret Key:', secretKey ? secretKey.substring(0, 8) + '...' : '未设置');
    
    // ======================
    // 我帮你关掉了错误判断
    // ======================
    // if (!apiKey || apiKey === 'your_api_key' || !secretKey || secretKey === 'your_secret_key') {
    //   reject(new Error('百度API密钥未配置，请在config/baidu.js中设置正确的API Key和Secret Key'));
    //   return;
    // }
    
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    logger.info('请求访问令牌URL:', url.substring(0, 80) + '...');

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          logger.info('访问令牌响应:', JSON.stringify(result));
          if (result.access_token) {
            this.accessToken = result.access_token;
            this.tokenExpireTime = Date.now() + (result.expires_in || 2592000) * 1000;
            logger.info('百度访问令牌获取成功');
            resolve(this.accessToken);
          } else {
            reject(new Error(result.error_description || '获取访问令牌失败'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

  /**
   * 执行口语评测
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
      // 验证音频数据
      if (!audioData || audioData.length === 0) {
        throw new Error('音频数据为空');
      }

      logger.info(`音频数据长度: ${audioData.length} bytes`);

      // 获取访问令牌
      const accessToken = await this.getAccessToken();

      // 将音频数据转换为base64
      const audioBase64 = audioData.toString('base64');

      // 构建请求参数
      const params = {
        model: baiduConfig.category[category] || 'sentence',
        text: text || '',
        format: format,
        rate: rate,
        channel: 1,
        cuid: crypto.randomBytes(16).toString('hex'),
        token: accessToken,
        speech: audioBase64,
        // 评分维度
        score_type: 1,  // 返回详细评分
        // 评测等级
        rank: baiduConfig.level[level] || 3,
        // 音频编码
        coding: 'raw'  // 原始音频数据
      };

      logger.info('发送评测请求:', JSON.stringify({
        model: params.model,
        text: params.text,
        format: params.format,
        rate: params.rate
      }));

      // 发送请求
      const result = await this.sendRequest(params);

      // 解析结果
      return this.parseResult(result);
    } catch (error) {
      logger.error('百度口语评测失败:', error);
      throw error;
    }
  }

  /**
   * 发送HTTP请求
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} 响应结果
   */
  sendRequest(params) {
    return new Promise((resolve, reject) => {
      const postData = querystring.stringify(params);
      const options = {
        hostname: 'vop.baidu.com',
        port: 443,
        path: '/server_api_1767',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.err_no === 0) {
              resolve(result);
            } else {
              reject(new Error(`评测失败: ${result.err_msg || '未知错误'}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
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
      if (firstResult.words) {
        firstResult.words.forEach(word => {
          words.push({
            word: word.word,
            score: parseFloat(word.score) || 0,
            startTime: word.begin_time || 0,
            endTime: word.end_time || 0
          });
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
          phonemes: []
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

module.exports = new BaiduIseService();
