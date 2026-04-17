/**
 * 测试模拟口语评测服务
 */

require('dotenv').config();
const mockBaiduIseService = require('./services/mockBaiduIseService');
const { logger } = require('./utils/logger');

console.log('环境变量 USE_MOCK_ISE:', process.env.USE_MOCK_ISE);
console.log('环境变量类型:', typeof process.env.USE_MOCK_ISE);
console.log('是否使用模拟服务:', process.env.USE_MOCK_ISE === 'true');

async function testMockService() {
  try {
    console.log('\n开始测试模拟服务...');

    // 模拟音频数据
    const mockAudioData = Buffer.from('mock audio data');

    // 测试评测
    const result = await mockBaiduIseService.evaluate(
      {
        text: 'Hello world, this is a test',
        category: 'sentence',
        level: 'senior'
      },
      mockAudioData
    );

    console.log('\n评测结果:');
    console.log('总体评分:', result.overallScore);
    console.log('各维度评分:', result.dimensions);
    console.log('单词详情:', result.details.words);

    // 生成建议
    const advice = mockBaiduIseService.generateAdvice(result);
    console.log('\n评测建议:', advice);

    console.log('\n测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testMockService();
