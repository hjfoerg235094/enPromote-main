/**
 * 英语口语评测模拟接口测试脚本
 * 用于测试百度智能云语音评测API的接入
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 配置信息
const CONFIG = {
  // 模拟服务器端口
  PORT: 3001,
  // 模拟的API Key和Secret Key（实际使用时替换为真实的）
  API_KEY: 'your_api_key_here',
  SECRET_KEY: 'your_secret_key_here',
  // 评测结果评分范围
  SCORE_RANGE: {
    MIN: 60,
    MAX: 100
  }
};

// 模拟评测结果数据结构
const MOCK_EVALUATION_RESULT = {
  err_no: 0,
  err_msg: 'success',
  data: {
    overall: 85, // 总分
    fluency: 88, // 流利度
    accuracy: 82, // 准确度
    completeness: 90, // 完整度
    // 详细评分
    details: [
      {
        word: 'hello',
        score: 90,
        phonemes: [
          { phoneme: 'h', score: 95 },
          { phoneme: 'e', score: 88 },
          { phoneme: 'l', score: 92 },
          { phoneme: 'l', score: 92 },
          { phoneme: 'o', score: 85 }
        ]
      },
      {
        word: 'world',
        score: 82,
        phonemes: [
          { phoneme: 'w', score: 88 },
          { phoneme: 'o', score: 80 },
          { phoneme: 'r', score: 85 },
          { phoneme: 'l', score: 78 },
          { phoneme: 'd', score: 79 }
        ]
      }
    ]
  }
};

/**
 * 生成随机评分
 */
function generateRandomScore() {
  return Math.floor(Math.random() * (CONFIG.SCORE_RANGE.MAX - CONFIG.SCORE_RANGE.MIN + 1)) + CONFIG.SCORE_RANGE.MIN;
}

/**
 * 生成模拟评测结果
 * @param {string} text - 评测文本
 * @returns {object} 模拟的评测结果
 */
function generateMockResult(text) {
  const words = text.split(/\s+/);
  const details = words.map(word => {
    const wordScore = generateRandomScore();
    const phonemes = word.split('').map(char => ({
      phoneme: char,
      score: generateRandomScore()
    }));

    return {
      word: word,
      score: wordScore,
      phonemes: phonemes
    };
  });

  // 计算各项平均分
  const avgOverall = Math.round(details.reduce((sum, d) => sum + d.score, 0) / details.length);
  const avgFluency = generateRandomScore();
  const avgAccuracy = generateRandomScore();
  const avgCompleteness = generateRandomScore();

  return {
    err_no: 0,
    err_msg: 'success',
    data: {
      overall: avgOverall,
      fluency: avgFluency,
      accuracy: avgAccuracy,
      completeness: avgCompleteness,
      details: details
    }
  };
}

/**
 * 创建模拟服务器
 */
function createMockServer() {
  const server = http.createServer((req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/ise/evaluate') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const requestData = JSON.parse(body);
          const { text, audioData } = requestData;

          // 模拟处理延迟
          setTimeout(() => {
            // 生成模拟评测结果
            const result = generateMockResult(text || 'hello world');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          }, 1000);
        } catch (error) {
          console.error('Error processing request:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            err_no: 1,
            err_msg: 'Invalid request data',
            data: null
          }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        err_no: 404,
        err_msg: 'Not found',
        data: null
      }));
    }
  });

  return server;
}

/**
 * 启动模拟服务器
 */
function startMockServer() {
  const server = createMockServer();

  server.listen(CONFIG.PORT, () => {
    console.log(`Mock ISE server is running on http://localhost:${CONFIG.PORT}`);
    console.log(`Test endpoint: http://localhost:${CONFIG.PORT}/api/ise/evaluate`);
  });

  return server;
}

/**
 * 测试函数 - 模拟客户端请求
 */
function testMockServer() {
  const testData = {
    text: 'hello world this is a test',
    audioData: 'mock_audio_data_base64_string'
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: CONFIG.PORT,
    path: '/api/ise/evaluate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('\n=== Test Result ===');
        console.log('Overall Score:', result.data.overall);
        console.log('Fluency:', result.data.fluency);
        console.log('Accuracy:', result.data.accuracy);
        console.log('Completeness:', result.data.completeness);
        console.log('\nWord Details:');
        result.data.details.forEach(detail => {
          console.log(`- ${detail.word}: ${detail.score}`);
        });
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

// 如果直接运行此脚本，则启动模拟服务器并执行测试
if (require.main === module) {
  const server = startMockServer();

  // 等待服务器启动后执行测试
  setTimeout(() => {
    testMockServer();
  }, 1500);

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\nShutting down mock server...');
    server.close(() => {
      console.log('Mock server closed');
      process.exit(0);
    });
  });
}

module.exports = {
  startMockServer,
  testMockServer,
  generateMockResult
};
