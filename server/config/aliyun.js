// 阿里云百炼配置
const aliyunConfig = {
  // API密钥
  apiKey: 'sk-78ddf11652064ef8a4970fa3e94b10f3',  // 请替换为你的阿里云API-KEY

  // API端点
  endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',

  // 模型配置
  models: {
    // 通义千问-Turbo（快速、经济）
    turbo: 'qwen-turbo',

    // 通义千问-Plus（平衡性能和成本）
    plus: 'qwen-plus',

    // 通义千问-Max（最强性能）
    max: 'qwen-max',

    // 通义千问-Long（长文本）
    long: 'qwen-long'
  },

  // 默认模型
  defaultModel: 'qwen-turbo'
};

module.exports = aliyunConfig;
