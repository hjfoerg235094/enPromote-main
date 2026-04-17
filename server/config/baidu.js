
// 百度语音口语评测配置
const baiduConfig = {
  // API密钥 - 需要从百度智能云平台获取
  appId: process.env.BAIDU_APP_ID || 'your_app_id',
  apiKey: process.env.BAIDU_API_KEY || 'your_api_key',
  secretKey: process.env.BAIDU_SECRET_KEY || 'your_secret_key',

  // API端点
  endpoint: 'https://vop.baidu.com/server_api_1767',

  // 评测类型
  category: {
    // 单词评测
    word: 'word',
    // 句子评测
    sentence: 'sentence',
    // 段落评测
    paragraph: 'paragraph',
    // 自由说
    free: 'topic'
  },

  // 评测等级
  level: {
    // 小学
    primary: 1,
    // 初中
    junior: 2,
    // 高中
    senior: 3,
    // 大学
    college: 4
  },

  // 默认配置
  defaultConfig: {
    category: 'sentence',
    level: 3,
    format: 'wav',
    rate: 16000,
    // 评分维度
    multiDimension: true,
    // 是否返回详细结果
    extra_ability: 1
  }
};

module.exports = baiduConfig;
