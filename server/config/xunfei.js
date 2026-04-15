
// 科大讯飞口语评测配置
const xunfeiConfig = {
  // API密钥 - 需要从科大讯飞开放平台获取
  appId: process.env.XUNFEI_APP_ID || 'your_app_id',
  apiKey: process.env.XUNFEI_API_KEY || 'your_api_key',
  apiSecret: process.env.XUNFEI_API_SECRET || 'your_api_secret',

  // API端点
  endpoint: 'wss://ise-api.xfyun.cn/v2/open-ise',

  // 评测类型
  category: {
    // 单词评测
    word: 'cn_vop',
    // 句子评测
    sentence: 'cn_vop',
    // 段落评测
    paragraph: 'cn_vop',
    // 自由说
    free: 'cn_vop'
  },

  // 评测等级
  level: {
    // 小学
    primary: 'primary',
    // 初中
    junior: 'junior',
    // 高中
    senior: 'senior',
    // 大学
    college: 'college'
  },

  // 默认配置
  defaultConfig: {
    category: 'cn_vop',
    level: 'senior',
    mode: 0,  // 0: 流式分片, 1: 非流式一次性
    format: 'audio/L16;rate=16000',
    encoding: 'raw',
    // 评分维度
    multiDimension: true,
    // 是否返回详细结果
    extra_ability: 1
  }
};

module.exports = xunfeiConfig;
