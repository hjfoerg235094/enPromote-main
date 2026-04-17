const crypto = require('crypto');
const WebSocket = require('ws');
const xunfeiConfig = require('../config/xunfei');
const { logger } = require('../utils/logger');

/**
 * 科大讯飞口语评测服务
 */
class XunfeiIseService {
  /**
   * 生成鉴权URL
   * @returns {string} 鉴权URL
   */
  generateAuthUrl() {
    const { apiKey, apiSecret } = xunfeiConfig;
    const host = "ise-api.xfyun.cn";
    const path = "/v2/open-ise";
    const date = new Date().toUTCString();

    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const signature = crypto.createHmac("sha256", apiSecret)
      .update(signatureOrigin)
      .digest("base64");

    const authorization = [
      `api_key="${apiKey}"`,
      `algorithm="hmac-sha256"`,
      `headers="host date request-line"`,
      `signature="${signature}"`
    ].join(", ");

    const authorizationBase64 = Buffer.from(authorization).toString("base64");

    const query = new URLSearchParams({
      authorization: authorizationBase64,
      date,
      host
    });

    return `wss://${host}${path}?${query}`;
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
      format = 'audio/L16;rate=16000',  // 音频格式
      encoding = 'raw' // 音频编码
    } = options;

    return new Promise((resolve, reject) => {
      const authUrl = this.generateAuthUrl();
      const ws = new WebSocket(authUrl);

      let result = null;
      let error = null;

      ws.on('open', () => {
        logger.info('科大讯飞口语评测连接成功');

        // 验证音频数据
        if (!audioData || audioData.length === 0) {
          logger.error('音频数据为空');
          ws.close();
          reject(new Error('音频数据为空'));
          return;
        }

        logger.info(`音频数据长度: ${audioData.length} bytes`);

        // 检查音频数据长度是否为偶数（16bit要求）
        if (audioData.length % 2 !== 0) {
          logger.warn(`音频数据长度为奇数: ${audioData.length}，将截断为偶数`);
          audioData = audioData.slice(0, audioData.length - 1);
        }

        // 按官方 ISE V2 接口协议：
        // 1) 参数帧：common + business + data.status=0
        // 2) 音频帧：data.status=0/1/2, data.data=base64(audioChunk)
        const businessCategory =
          category === 'word'
            ? 'read_word'
            : category === 'paragraph'
              ? 'read_chapter'
              : category === 'free'
                ? 'topic'
                : 'read_sentence';

        // 按照科大讯飞ISE V2协议，参数帧应该包含common和business字段
        const ssbFrame = {
          common: {
            app_id: xunfeiConfig.appId,
          },
          business: {
            language: 'en_us',
            category: businessCategory,
            auf: 'audio/L16;rate=16000',
            aue: 'raw',
            text: text || '',
          }
        };

        logger.info('发送参数帧:', JSON.stringify(ssbFrame));
        ws.send(JSON.stringify(ssbFrame));

        // 分帧发送音频（建议 40ms 一帧，16k/16bit/mono => 1280 bytes）
        const buf = Buffer.isBuffer(audioData) ? audioData : Buffer.from(audioData);
        const frameSize = 1280;
        const intervalMs = 40;

        let offset = 0;
        let frameIndex = 0;

        const sendNext = () => {
          if (ws.readyState !== WebSocket.OPEN) return;

          const remaining = buf.length - offset;
          if (remaining <= 0) {
            // 无音频也要发送结束帧
            const endFrame = {
              data: { status: 2, data: '' },
            };
            ws.send(JSON.stringify(endFrame));
            return;
          }

          // 确保每次发送的数据长度是偶数（16bit要求）
          let chunkSize = Math.min(frameSize, remaining);
          // 如果chunkSize是奇数，减1使其变为偶数
          if (chunkSize % 2 !== 0) {
            chunkSize -= 1;
          }
          const chunk = buf.subarray(offset, offset + chunkSize);
          offset += chunk.length;

          const isFirst = frameIndex === 0;
          const isLast = offset >= buf.length;

          // 设置数据状态：0=首帧，1=中间帧，2=结束帧
          let dataStatus;
          if (isFirst && isLast) {
            dataStatus = 2; // 只有一帧，既是首帧也是结束帧
          } else if (isFirst) {
            dataStatus = 0; // 首帧
          } else if (isLast) {
            dataStatus = 2; // 结束帧
          } else {
            dataStatus = 1; // 中间帧
          }

          const auwFrame = {
            data: {
              status: dataStatus,
              data: chunk.toString('base64'),
            },
          };

          logger.info(`发送音频帧 ${frameIndex}: status=${dataStatus}, chunkSize=${chunk.length}`);
          ws.send(JSON.stringify(auwFrame));
          frameIndex += 1;

          if (!isLast) {
            setTimeout(sendNext, intervalMs);
          }
        };

        // 稍微延迟一下，避免参数帧与第一帧音频抢占（更稳）
        setTimeout(sendNext, 10);
      });

      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());

          if (response.code !== 0) {
            const errorMsg = `评测失败: code=${response.code}, message=${response.message}`;
            logger.error(errorMsg);
            
            // 特别处理8195错误码（音频格式错误）
            if (response.code === 8195) {
              logger.error('音频格式错误(8195)，可能原因：');
              logger.error('1. 音频数据包含WAV头未移除');
              logger.error('2. 音频数据长度不是偶数');
              logger.error('3. 音频采样率不是16000Hz');
              logger.error('4. 音频不是单声道');
              logger.error('5. 音频位深不是16bit');
              logger.error(`当前音频数据长度: ${audioData ? audioData.length : 0} bytes`);
            }
            
            error = new Error(errorMsg);
            ws.close();
            return;
          }

          // 流式返回结果，最后一次返回完整打分
          if (response.data && response.data.status === 2) {
            // response.data.data 为 base64(xml)
            const xmlBase64 = response.data.data || '';
            const xml = Buffer.from(xmlBase64, 'base64').toString('utf8');
            result = this.parseResult(xml);
            ws.close();
          }
        } catch (e) {
          error = e;
          ws.close();
        }
      });

      ws.on('error', (err) => {
        error = err;
        logger.error('科大讯飞口语评测连接错误:', err);
      });

      ws.on('close', () => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('评测未返回结果'));
        }
      });

      // 设置超时
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          reject(new Error('评测超时'));
        }
      }, 30000);
    });
  }

  /**
   * 解析评测结果
   * @param {string} xml - 原始结果 XML 字符串
   * @returns {Object} 解析后的结果
   */
  parseResult(xml) {
    try {
      const safeXml = typeof xml === 'string' ? xml : '';

      const pick = (name) => {
        const m = safeXml.match(new RegExp(`${name}="([0-9.]+)"`));
        return m ? parseFloat(m[1]) : 0;
      };

      const overallScore = pick('total_score');
      const accuracy = pick('accuracy_score');
      const fluency = pick('fluency_score');
      const integrity = pick('integrity_score');
      // 英文发音质量可用 phone_score / standard_score（不同题型字段不同）
      const pronunciation = pick('phone_score') || pick('standard_score');

      return {
        // 总体评分
        overallScore: overallScore || 0,

        // 维度评分
        dimensions: {
          accuracy: accuracy || 0,    // 发音准确度
          fluency: fluency || 0,      // 流利度
          integrity: integrity || 0,  // 完整度
          pronunciation: pronunciation || 0,  // 发音
          speed: 0,
          intonation: 0
        },

        // 详细信息
        details: {
          // 目前先保证主评分可用，细粒度后续可从 XML 进一步解析
          words: [],
          phonemes: []
        },

        // 原始数据
        raw: safeXml
      };
    } catch (error) {
      logger.error('解析评测结果失败:', error);
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
  }

  /**
   * 计算语速评分
   * @param {Object} data - 原始评测数据
   * @returns {number} 语速评分 (0-100)
   */
  calculateSpeed(data) {
    try {
      // 根据音频时长和文本长度计算语速
      if (data.sentences && data.sentences.length > 0) {
        const totalTime = data.sentences.reduce((sum, sentence) => {
          return sum + (sentence.time_len || 0);
        }, 0);
        
        const totalWords = data.sentences.reduce((sum, sentence) => {
          return sum + (sentence.words ? sentence.words.length : 0);
        }, 0);
        
        if (totalTime > 0 && totalWords > 0) {
          // 计算每分钟词数 (WPM)
          const wpm = (totalWords / totalTime) * 60;
          
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
      // 基于音素评分和句子结构计算语调
      if (data.sentences && data.sentences.length > 0) {
        let totalPhonemeScore = 0;
        let phonemeCount = 0;
        
        data.sentences.forEach(sentence => {
          if (sentence.words) {
            sentence.words.forEach(word => {
              if (word.phonemes) {
                word.phonemes.forEach(phoneme => {
                  totalPhonemeScore += phoneme.dp_score || 0;
                  phonemeCount++;
                });
              }
            });
          }
        });
        
        if (phonemeCount > 0) {
          const avgPhonemeScore = totalPhonemeScore / phonemeCount;
          // 语调评分基于音素评分，并考虑句子结构
          const sentenceVariation = Math.min(1, data.sentences.length / 3);
          return avgPhonemeScore * (0.7 + 0.3 * sentenceVariation);
        }
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

module.exports = new XunfeiIseService();