const redis = require('redis');
const { logger } = require('../utils/logger');

// Redis 配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  // 连接超时时间（毫秒）
  connectTimeout: 10000,
  // 重试策略
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // 最大重试次数
  maxRetriesPerRequest: 3,
};

// 创建 Redis 客户端
const redisClient = redis.createClient(redisConfig);

// 连接事件处理
redisClient.on('connect', () => {
  logger.info('Redis 客户端已连接');
});

redisClient.on('ready', () => {
  logger.info('Redis 客户端已准备就绪');
});

redisClient.on('error', (err) => {
  logger.error('Redis 客户端错误:', err);
});

redisClient.on('end', () => {
  logger.warn('Redis 客户端连接已关闭');
});

// 显式连接 Redis
redisClient.connect().catch(err => {
  logger.error('Redis 连接失败:', err);
});

// 优雅关闭
process.on('SIGINT', () => {
  redisClient.quit();
});

process.on('SIGTERM', () => {
  redisClient.quit();
});

module.exports = redisClient;
