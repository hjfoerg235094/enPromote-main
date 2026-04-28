// 配置服务器（敏感信息从 .env 读取，参考 .env.example）
const port = parseInt(process.env.PORT, 10) || 3000;
const host = process.env.HOST || 'localhost';
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/EnglishMastery';
const proxyurl = process.env.PROXY_HOST || '127.0.0.1';
const proxyProt = parseInt(process.env.PROXY_PORT, 10) || 7897;

const baseUrl = process.env.AI_BASE_URL || 'https://api.deepseek.com';
const apiKey = process.env.AI_API_KEY || '';

// 阿里云百炼 API 配置，和通用 AI 配置分开，避免把 DeepSeek/OpenAI 地址误拼成 DashScope 地址。
const aliyunBaseUrl = process.env.ALIYUN_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const aliyunApiKey = process.env.ALIYUN_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY || '';

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('警告: 生产环境未配置 AI_API_KEY，AI 功能可能不可用');
}

if (!aliyunApiKey && process.env.NODE_ENV === 'production') {
  console.warn('警告: 生产环境未配置 ALIYUN_API_KEY，阿里云百炼功能可能不可用');
}

module.exports = {
  port,
  host,
  dbUrl,
  proxyurl,
  proxyProt,
  baseUrl,
  apiKey,
  aliyunBaseUrl,
  aliyunApiKey
};
