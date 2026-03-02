/**
 * 基于艾宾浩斯遗忘曲线的间隔重复算法
 * 根据用户对单词的掌握程度和复习历史计算下次复习时间
 */

// 艾宾浩斯遗忘曲线的复习间隔（以分钟为单位）
const REVIEW_INTERVALS = [
  1,         // 第一次复习：1分钟后
  5,         // 第二次复习：5分钟后
  30,        // 第三次复习：30分钟后
  720,       // 第四次复习：12小时后
  1440,      // 第五次复习：1天后
  2880,      // 第六次复习：2天后
  7200,      // 第七次复习：5天后
  14400,     // 第八次复习：10天后
  28800,     // 第九次复习：20天后
  57600      // 第十次复习：40天后
];

// 不同掌握状态对应的复习间隔调整系数
const MASTERY_MULTIPLIERS = {
  'unknown': 0.5,    // 不认识：缩短复习间隔
  'vague': 0.8,      // 模糊：略微缩短复习间隔
  'know': 1.2,        // 认识：延长复习间隔
  'mastered': 2.0     // 已掌握：大幅延长复习间隔
};

/**
 * 计算单词的下次复习时间
 * @param {Object} wordData - 单词数据
 * @param {string} wordData.status - 单词掌握状态
 * @param {number} wordData.reviewCounts - 复习次数
 * @param {Date} wordData.lastSeenAt - 上次复习时间
 * @returns {Date} 下次复习时间
 */
function calculateNextReviewTime(wordData) {
  const { status, reviewCounts, lastSeenAt } = wordData;

  // 如果是第一次学习，设置一个较短的初始间隔
  if (reviewCounts === 0) {
    const nextReview = new Date(lastSeenAt);
    nextReview.setMinutes(nextReview.getMinutes() + REVIEW_INTERVALS[0]);
    return nextReview;
  }

  // 获取基础复习间隔
  let intervalIndex = Math.min(reviewCounts, REVIEW_INTERVALS.length - 1);
  let baseInterval = REVIEW_INTERVALS[intervalIndex];

  // 根据掌握状态调整间隔
  const multiplier = MASTERY_MULTIPLIERS[status] || 1;
  const adjustedInterval = Math.round(baseInterval * multiplier);

  // 计算下次复习时间
  const nextReview = new Date(lastSeenAt);
  nextReview.setMinutes(nextReview.getMinutes() + adjustedInterval);

  return nextReview;
}

/**
 * 计算单词的复习优先级（用于排序）
 * @param {Object} wordData - 单词数据
 * @returns {number} 优先级分数（越高越优先）
 */
function calculateReviewPriority(wordData) {
  const { status, reviewCounts, lastSeenAt, nextReviewTime } = wordData;
  const now = new Date();

  // 分项打分（满分100）
  let score = 0;

  // 1. 状态权重：掌握程度越低，分数越高
  switch (status) {
    case 'unknown': score += 40; break;
    case 'vague': score += 30; break;
    case 'know': score += 15; break;
    case 'mastered': score += 5; break;
    default: score += 20; break;
  }

  // 2. 复习次数权重：复习次数越少，分数越高
  score += Math.max(20 - reviewCounts, 0); // 最多加20分

  // 3. 距离上次复习时间权重：时间越久，分数越高
  const lastSeen = new Date(lastSeenAt);
  const hoursSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60); // 小时
  score += Math.min(hoursSinceLastSeen * 0.5, 15); // 最多加15分

  // 4. 复习时间过期权重：过期时间越长，分数越高
  const nextReview = new Date(nextReviewTime);
  const overdueHours = (now - nextReview) / (1000 * 60 * 60);
  if (overdueHours > 0) {
    score += Math.min(overdueHours * 2, 30); // 最多加30分
  }

  // 总分上限控制
  return Math.min(Math.round(score), 100);
}

/**
 * 更新单词的复习状态和下次复习时间
 * @param {Object} wordData - 单词数据
 * @param {string} newStatus - 新的掌握状态
 * @returns {Object} 更新后的单词数据
 */
function updateWordReviewStatus(wordData, newStatus) {
  const now = new Date();
  const updatedData = { ...wordData };

  // 更新状态和复习次数
  updatedData.status = newStatus;
  updatedData.reviewCounts = (updatedData.reviewCounts || 0) + 1;
  updatedData.lastSeenAt = now;

  // 计算下次复习时间
  updatedData.nextReviewTime = calculateNextReviewTime(updatedData);

  // 计算优先级
  updatedData.priority = calculateReviewPriority(updatedData);

  return updatedData;
}

/**
 * 获取今日需要复习的单词数量
 * @param {Array} words - 单词列表
 * @returns {number} 今日需要复习的单词数量
 */
function getTodayReviewCount(words) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  return words.filter(word => {
    const nextReview = new Date(word.nextReviewTime);
    return nextReview >= todayStart && nextReview <= todayEnd;
  }).length;
}

/**
 * 获取未来几天的复习计划
 * @param {Array} words - 单词列表
 * @param {number} days - 未来天数
 * @returns {Array} 每天的复习计划
 */
function getReviewSchedule(words, days = 7) {
  const schedule = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayWords = words.filter(word => {
      const nextReview = new Date(word.nextReviewTime);
      return nextReview >= dayStart && nextReview <= dayEnd;
    });

    schedule.push({
      date: dayStart.toISOString().split('T')[0],
      count: dayWords.length,
      words: dayWords
    });
  }

  return schedule;
}

module.exports = {
  calculateNextReviewTime,
  calculateReviewPriority,
  updateWordReviewStatus,
  getTodayReviewCount,
  getReviewSchedule,
  REVIEW_INTERVALS,
  MASTERY_MULTIPLIERS
};
