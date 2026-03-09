
/**
 * Redis 缓存使用示例
 * 
 * 本文件展示了如何在项目中使用 Redis 缓存工具类
 */

const RedisCache = require('./redisCache');

// ==================== 基础缓存操作 ====================

// 示例 1: 设置和获取简单缓存
async function example1() {
  // 设置缓存，过期时间为 1 小时（3600 秒）
  await RedisCache.set('user:123', { name: '张三', age: 25 }, 3600);

  // 获取缓存
  const user = await RedisCache.get('user:123');
  console.log('用户信息:', user); // 输出: { name: '张三', age: 25 }
}

// 示例 2: 检查缓存是否存在
async function example2() {
  const exists = await RedisCache.exists('user:123');
  console.log('缓存是否存在:', exists); // 输出: true
}

// 示例 3: 删除缓存
async function example3() {
  await RedisCache.del('user:123');
  console.log('缓存已删除');
}

// ==================== 批量操作 ====================

// 示例 4: 批量删除缓存
async function example4() {
  const keys = ['user:123', 'user:456', 'user:789'];
  await RedisCache.delMultiple(keys);
  console.log('批量删除完成');
}

// 示例 5: 清除匹配模式的缓存
async function example5() {
  // 删除所有以 "user:" 开头的缓存
  const count = await RedisCache.clearPattern('user:*');
  console.log(`已删除 ${count} 个缓存`);
}

// ==================== 过期时间操作 ====================

// 示例 6: 设置过期时间
async function example6() {
  await RedisCache.set('temp:data', { value: '临时数据' });
  await RedisCache.expire('temp:data', 300); // 设置 5 分钟后过期
}

// 示例 7: 获取剩余过期时间
async function example7() {
  const ttl = await RedisCache.ttl('temp:data');
  console.log(`剩余过期时间: ${ttl} 秒`);
}

// ==================== 原子操作 ====================

// 示例 8: 获取并删除缓存（原子操作）
async function example8() {
  const value = await RedisCache.getAndDel('temp:data');
  console.log('获取的值:', value);
  // 缓存已被删除
}

// ==================== 哈希表操作 ====================

// 示例 9: 使用哈希表存储用户信息
async function example9() {
  const userId = 'user:123';

  // 设置多个字段
  await RedisCache.hSet(userId, 'name', '李四');
  await RedisCache.hSet(userId, 'age', 30);
  await RedisCache.hSet(userId, 'email', 'lisi@example.com');

  // 获取单个字段
  const name = await RedisCache.hGet(userId, 'name');
  console.log('用户名:', name);

  // 获取所有字段
  const user = await RedisCache.hGetAll(userId);
  console.log('用户信息:', user);
}

// 示例 10: 删除哈希表字段
async function example10() {
  await RedisCache.hDel('user:123', 'email');
  console.log('邮箱字段已删除');
}

// ==================== 列表操作 ====================

// 示例 11: 使用列表存储消息队列
async function example11() {
  const queueKey = 'message:queue';

  // 添加消息到队列
  await RedisCache.lPush(queueKey, [
    { type: 'email', to: 'user1@example.com', content: '消息1' },
    { type: 'sms', to: '13800138000', content: '消息2' },
    { type: 'email', to: 'user2@example.com', content: '消息3' }
  ], 3600);

  // 从队列中取出消息
  const message = await RedisCache.rPop(queueKey);
  console.log('处理消息:', message);
}

// 示例 12: 获取列表范围内的元素
async function example12() {
  const queueKey = 'message:queue';

  // 获取队列中的所有消息
  const messages = await RedisCache.lRange(queueKey, 0, -1);
  console.log('队列中的消息:', messages);
}

// ==================== 有序集合操作 ====================

// 示例 13: 使用有序集合实现排行榜
async function example13() {
  const leaderboardKey = 'game:leaderboard';

  // 添加玩家分数
  await RedisCache.zAdd(leaderboardKey, [
    { score: 100, value: { id: 'player1', name: '玩家1' } },
    { score: 200, value: { id: 'player2', name: '玩家2' } },
    { score: 150, value: { id: 'player3', name: '玩家3' } }
  ], 86400); // 24小时后过期

  // 获取排行榜（按分数降序）
  const leaderboard = await RedisCache.zRange(leaderboardKey, 0, -1, true);
  console.log('排行榜:', leaderboard);
}

// 示例 14: 获取玩家排名
async function example14() {
  const leaderboardKey = 'game:leaderboard';

  // 获取玩家2的排名
  const rank = await RedisCache.zRank(leaderboardKey, { id: 'player2', name: '玩家2' }, true);
  console.log('玩家2的排名:', rank + 1); // 排名从0开始，所以+1
}

// 示例 15: 从排行榜中移除玩家
async function example15() {
  const leaderboardKey = 'game:leaderboard';

  await RedisCache.zRem(leaderboardKey, { id: 'player1', name: '玩家1' });
  console.log('玩家1已从排行榜移除');
}

// ==================== 实际应用场景 ====================

// 示例 16: 缓存用户学习报告
async function cacheUserStudyReport(userId, date) {
  const cacheKey = `report:${userId}:${date}`;
  const reportData = {
    studyTime: 120, // 学习时长（分钟）
    newWords: 20,   // 新学单词数
    reviewWords: 50,// 复习单词数
    accuracy: 0.85  // 正确率
  };

  // 缓存24小时
  await RedisCache.set(cacheKey, reportData, 86400);
}

// 示例 17: 获取用户学习报告（带缓存）
async function getUserStudyReport(userId, date) {
  const cacheKey = `report:${userId}:${date}`;

  // 先尝试从缓存获取
  let report = await RedisCache.get(cacheKey);

  if (report) {
    console.log('从缓存获取报告');
    return report;
  }

  // 缓存未命中，从数据库查询
  console.log('从数据库查询报告');
  report = await fetchReportFromDatabase(userId, date);

  // 将结果存入缓存
  await RedisCache.set(cacheKey, report, 86400);

  return report;
}

// 模拟从数据库获取报告
async function fetchReportFromDatabase(userId, date) {
  // 这里应该是实际的数据库查询逻辑
  return {
    studyTime: 120,
    newWords: 20,
    reviewWords: 50,
    accuracy: 0.85
  };
}

// 示例 18: 缓存 AI 对话上下文
async function cacheAIConversation(userId, conversationId, context) {
  const cacheKey = `ai:conversation:${userId}:${conversationId}`;

  // 缓存对话上下文，过期时间设置为 1 小时
  await RedisCache.set(cacheKey, context, 3600);
}

// 示例 19: 获取 AI 对话上下文
async function getAIConversation(userId, conversationId) {
  const cacheKey = `ai:conversation:${userId}:${conversationId}`;

  return await RedisCache.get(cacheKey);
}

// 示例 20: 缓存用户待复习单词列表
async function cacheReviewWords(userId, wordList) {
  const cacheKey = `review:words:${userId}`;

  // 缓存待复习单词列表，过期时间设置为 30 分钟
  await RedisCache.set(cacheKey, wordList, 1800);
}

// 示例 21: 获取用户待复习单词列表
async function getReviewWords(userId) {
  const cacheKey = `review:words:${userId}`;

  return await RedisCache.get(cacheKey);
}

// 示例 22: 更新用户待复习单词列表
async function updateReviewWords(userId, newWords) {
  const cacheKey = `review:words:${userId}`;

  // 先删除旧缓存
  await RedisCache.del(cacheKey);

  // 设置新缓存
  await RedisCache.set(cacheKey, newWords, 1800);
}

module.exports = {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  example10,
  example11,
  example12,
  example13,
  example14,
  example15,
  cacheUserStudyReport,
  getUserStudyReport,
  cacheAIConversation,
  getAIConversation,
  cacheReviewWords,
  getReviewWords,
  updateReviewWords
};
