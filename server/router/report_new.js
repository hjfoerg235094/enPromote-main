
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const StudyRecord = require('../modules/StudyRecord');
const User = require('../modules/User');
const UserWord = require('../modules/UserWord');
const StudyRecordService = require('../modules/StudyRecordService');

const EMPTY_MODULE_STUDY_TIME = {
  vocabulary: 0,
  listening: 0,
  spelling: 0,
  aiPractice: 0
};

const EMPTY_WORDS_LEARNED = {
  newWords: 0,
  reviewWords: 0
};

const EMPTY_PRACTICE_STATS = {
  vocabularyRecognitionAccuracy: 0,
  spellingAccuracy: 0,
  listeningCompletion: 0,
  aiPracticeCount: 0
};

const roundNumber = (value, precision = 2) => {
  const number = Number(value) || 0;
  return Number(number.toFixed(precision));
};

const normalizeStudyModule = (module) => {
  if (module === 'review') return 'vocabulary';
  return module;
};

const ALLOWED_STUDY_MODULES = new Set(['vocabulary', 'listening', 'spelling', 'aiPractice']);
const MIN_STUDY_MINUTES = 0.1;
const MAX_STUDY_MINUTES = 180;

const clampStudyMinutes = (minutes) => {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return roundNumber(Math.min(Math.max(value, MIN_STUDY_MINUTES), MAX_STUDY_MINUTES));
};

const parseValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculateStudyMinutes = ({ studyTime, startTime, endTime }) => {
  const start = parseValidDate(startTime);
  const end = parseValidDate(endTime);

  if (start && end && end > start) {
    return clampStudyMinutes((end.getTime() - start.getTime()) / 1000 / 60);
  }

  return clampStudyMinutes(studyTime);
};

const parseLocalDate = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const now = date ? new Date(date) : new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayRange = (date) => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

const weightedAccuracy = (sessions = [], module) => {
  const moduleSessions = sessions.filter(session => {
    return session.module === module && typeof session.accuracy === 'number';
  });

  const totalWords = moduleSessions.reduce((sum, session) => sum + (session.wordsCount || 0), 0);
  if (totalWords > 0) {
    const weightedTotal = moduleSessions.reduce((sum, session) => {
      return sum + ((session.accuracy || 0) * (session.wordsCount || 0));
    }, 0);
    return roundNumber(weightedTotal / totalWords);
  }

  if (moduleSessions.length === 0) return 0;
  const average = moduleSessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / moduleSessions.length;
  return roundNumber(average);
};

const normalizeModuleStudyTime = (moduleStudyTime = {}) => ({
  vocabulary: roundNumber(moduleStudyTime.vocabulary),
  listening: roundNumber(moduleStudyTime.listening),
  spelling: roundNumber(moduleStudyTime.spelling),
  aiPractice: roundNumber(moduleStudyTime.aiPractice)
});

const normalizeWordsLearned = (wordsLearned = {}) => ({
  newWords: Math.max(0, Math.round(Number(wordsLearned.newWords) || 0)),
  reviewWords: Math.max(0, Math.round(Number(wordsLearned.reviewWords) || 0))
});

const calculateUserMasteryRate = async (userId) => {
  const userWords = await UserWord.find({ userId }).select('status reviewCounts').lean();
  if (!userWords.length) return 0;

  const masteredWords = userWords.filter(word => {
    return ['know', 'mastered'].includes(word.status) || word.reviewCounts >= 3;
  }).length;

  return roundNumber(masteredWords / userWords.length);
};

const buildDailyReport = async ({ userId, user, record, queryDate }) => {
  const recordObject = record?.toObject ? record.toObject() : record;
  const sessions = recordObject?.sessions || [];
  const totalStudyTime = roundNumber(recordObject?.totalStudyTime);
  const moduleStudyTime = normalizeModuleStudyTime(recordObject?.moduleStudyTime || EMPTY_MODULE_STUDY_TIME);
  const wordsLearned = normalizeWordsLearned(recordObject?.wordsLearned || EMPTY_WORDS_LEARNED);
  const totalWords = wordsLearned.newWords + wordsLearned.reviewWords;
  const wordsPerMinute = totalStudyTime > 0 ? roundNumber(totalWords / totalStudyTime) : 0;
  const masteryRate = await calculateUserMasteryRate(userId);

  return {
    date: formatLocalDate(queryDate),
    totalStudyTime,
    moduleStudyTime,
    wordsLearned,
    practiceStats: {
      ...EMPTY_PRACTICE_STATS,
      ...(recordObject?.practiceStats || {}),
      vocabularyRecognitionAccuracy: weightedAccuracy(sessions, 'vocabulary'),
      spellingAccuracy: roundNumber(recordObject?.practiceStats?.spellingAccuracy),
      listeningCompletion: roundNumber(recordObject?.practiceStats?.listeningCompletion),
      aiPracticeCount: Math.max(0, Math.round(Number(recordObject?.practiceStats?.aiPracticeCount) || 0))
    },
    achievements: {
      continuousDays: user.checkIn?.continuousCheckInDays || user.streakDays || 0,
      totalDays: user.checkIn?.totalCheckInDays || user.studyHistory?.length || 0,
      unlockedAchievements: []
    },
    efficiency: {
      wordsPerMinute,
      masteryRate,
      masterySpeed: totalStudyTime > 0 ? roundNumber(wordsPerMinute * masteryRate, 3) : 0
    },
    dataQuality: {
      hasRecord: Boolean(recordObject),
      sessionCount: sessions.length,
      isEstimated: sessions.some(session => session.module === 'vocabulary' && session.accuracy === 0 && session.wordsCount > 0)
    }
  };
};

/**
 * 记录学习时长
 * POST /report/record
 * 参数:
 *   - module: 学习模块类型 (vocabulary, listening, spelling, aiPractice)
 *   - studyTime: 学习时长（分钟）
 *   - newWords: 新学单词数
 *   - reviewWords: 复习单词数
 *   - accuracy: 正确率
 *   - startTime: 开始时间
 *   - endTime: 结束时间
 */
router.post('/record', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const { module, studyTime, newWords, reviewWords, accuracy, startTime, endTime } = req.body;
    const normalizedModule = normalizeStudyModule(module);
    const calculatedStudyTime = calculateStudyMinutes({ studyTime, startTime, endTime });
    const normalizedStartTime = parseValidDate(startTime) || new Date(Date.now() - calculatedStudyTime * 60 * 1000);
    const normalizedEndTime = parseValidDate(endTime) || new Date();

    // 验证参数
    if (!ALLOWED_STUDY_MODULES.has(normalizedModule) || calculatedStudyTime <= 0) {
      return res.status(400).json({
        code: 400,
        message: '学习模块不支持或学习时长无效'
      });
    }

    // 记录学习活动
    await StudyRecordService.recordStudyActivity(userid, normalizedModule, {
      studyTime: calculatedStudyTime,
      newWords: newWords || 0,
      reviewWords: reviewWords || 0,
      wordsCount: (newWords || 0) + (reviewWords || 0),
      accuracy: accuracy || 0,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime
    });

    res.json({
      code: 200,
      message: '记录成功'
    });
  } catch (error) {
    logger.error('记录学习时长失败:', error);
    res.status(500).json({
      code: 500,
      message: '记录学习时长失败',
      error: error.message
    });
  }
});

/**
 * 获取每日学习报告
 * GET /report/daily
 * 参数:
 *   - date: 日期，格式: YYYY-MM-DD，默认为今天
 */
router.get('/daily', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const { date } = req.query;
    const queryDate = parseLocalDate(date);
    const { startDate, endDate } = getDayRange(queryDate);

    // 查询当天的学习记录
    const record = await StudyRecord.findOne({
      userId: userid,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // 获取用户信息
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const reportData = await buildDailyReport({
      userId: userid,
      user,
      record,
      queryDate
    });

    res.json({
      code: 200,
      message: 'success',
      data: reportData
    });
  } catch (error) {
    logger.error('获取每日学习报告失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取每日学习报告失败',
      error: error.message
    });
  }
});

/**
 * 获取学习进度趋势
 * GET /report/trend
 * 参数:
 *   - startDate: 开始日期，格式: YYYY-MM-DD
 *   - endDate: 结束日期，格式: YYYY-MM-DD
 */
router.get('/trend', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const { startDate, endDate } = req.query;

    // 验证日期参数
    if (!startDate || !endDate) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数: startDate 和 endDate'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // 从数据库获取学习记录
    const records = await StudyRecord.find({
      userId: userid,
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    // 转换为趋势数据
    const trendData = records.map(record => ({
      date: record.date.toISOString().split('T')[0],
      studyTime: record.totalStudyTime,
      wordsCount: record.wordsLearned.newWords + record.wordsLearned.reviewWords
    }));

    res.json({
      code: 200,
      message: 'success',
      data: trendData
    });
  } catch (error) {
    logger.error('获取学习进度趋势失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学习进度趋势失败',
      error: error.message
    });
  }
});

/**
 * 获取学习效率趋势
 * GET /report/efficiency-trend
 * 参数:
 *   - startDate: 开始日期，格式: YYYY-MM-DD
 *   - endDate: 结束日期，格式: YYYY-MM-DD
 */
router.get('/efficiency-trend', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const { startDate, endDate } = req.query;

    // 验证日期参数
    if (!startDate || !endDate) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数: startDate 和 endDate'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // 从数据库获取学习记录
    const records = await StudyRecord.find({
      userId: userid,
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    // 转换为效率趋势数据
    const efficiencyTrendData = records.map(record => ({
      date: record.date.toISOString().split('T')[0],
      studyTime: record.totalStudyTime,
      wordsCount: record.wordsLearned.newWords + record.wordsLearned.reviewWords,
      wordsPerMinute: record.efficiency?.wordsPerMinute || 0,
      masteryRate: record.efficiency?.masteryRate || 0,
      masterySpeed: record.efficiency?.masterySpeed || 0
    }));

    res.json({
      code: 200,
      message: 'success',
      data: efficiencyTrendData
    });
  } catch (error) {
    logger.error('获取学习效率趋势失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学习效率趋势失败',
      error: error.message
    });
  }
});

/**
 * 获取历史对比数据
 * GET /report/historical-comparison
 */
router.get('/historical-comparison', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 计算上周、上月和全部时间的日期范围
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // 获取不同时间段的学习记录
    const lastWeekRecords = await StudyRecord.find({
      userId: userid,
      date: { $gte: lastWeekStart, $lt: now }
    });

    const lastMonthRecords = await StudyRecord.find({
      userId: userid,
      date: { $gte: lastMonthStart, $lt: now }
    });

    const allTimeRecords = await StudyRecord.find({
      userId: userid
    });

    // 计算平均值
    const calculateAverage = (records) => {
      if (records.length === 0) {
        return { wordsPerMinute: 0, masteryRate: 0, masterySpeed: 0 };
      }

      const totalStudyTime = records.reduce((sum, r) => sum + r.totalStudyTime, 0);
      const totalWords = records.reduce((sum, r) => sum + r.wordsLearned.newWords + r.wordsLearned.reviewWords, 0);
      const totalMasteryRate = records.reduce((sum, r) => sum + (r.efficiency?.masteryRate || 0), 0);
      const totalMasterySpeed = records.reduce((sum, r) => sum + (r.efficiency?.masterySpeed || 0), 0);

      return {
        wordsPerMinute: totalStudyTime > 0 ? totalWords / totalStudyTime : 0,
        masteryRate: totalMasteryRate / records.length,
        masterySpeed: totalMasterySpeed / records.length
      };
    };

    const historicalComparison = {
      lastWeek: calculateAverage(lastWeekRecords),
      lastMonth: calculateAverage(lastMonthRecords),
      allTime: calculateAverage(allTimeRecords)
    };

    res.json({
      code: 200,
      message: 'success',
      data: historicalComparison
    });
  } catch (error) {
    logger.error('获取历史对比数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取历史对比数据失败',
      error: error.message
    });
  }
});

/**
 * 获取成就列表
 * GET /report/achievements
 */
router.get('/achievements', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 获取用户学习统计
    const totalWords = user.cet4.learnedWords || 0;
    const continuousDays = user.checkIn?.continuousCheckInDays || 0;
    const totalDays = user.checkIn?.totalCheckInDays || 0;

    // 获取最近30天的学习记录，计算平均正确率
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await StudyRecord.find({
      userId: userid,
      date: { $gte: thirtyDaysAgo }
    });

    const avgSpellingAccuracy = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + (r.practiceStats?.spellingAccuracy || 0), 0) / recentRecords.length
      : 0;

    const totalAiPractice = recentRecords.reduce((sum, r) => sum + (r.practiceStats?.aiPracticeCount || 0), 0);

    // 定义成就列表
    const achievements = [
      {
        id: 'first_week',
        name: '初出茅庐',
        description: '连续学习7天',
        icon: '🌱',
        unlocked: continuousDays >= 7,
        unlockedDate: continuousDays >= 7 ? user.checkIn.lastCheckInDate?.toISOString().split('T')[0] : undefined,
        progress: continuousDays < 7 ? { current: continuousDays, target: 7 } : undefined
      },
      {
        id: 'word_master_100',
        name: '词汇达人',
        description: '累计学习100个单词',
        icon: '📚',
        unlocked: totalWords >= 100,
        unlockedDate: totalWords >= 100 ? user.cet4.lastStudyTime?.toISOString().split('T')[0] : undefined,
        progress: totalWords < 100 ? { current: totalWords, target: 100 } : undefined
      },
      {
        id: 'spelling_master',
        name: '拼写大师',
        description: '拼写正确率达到90%',
        icon: '✏️',
        unlocked: avgSpellingAccuracy >= 90,
        progress: avgSpellingAccuracy < 90 ? { current: Math.round(avgSpellingAccuracy), target: 90 } : undefined
      },
      {
        id: 'listening_pro',
        name: '听力专家',
        description: '完成50次听力练习',
        icon: '🎧',
        unlocked: false, // TODO: 需要记录听力练习次数
        progress: { current: 0, target: 50 }
      },
      {
        id: 'ai_chat_master',
        name: '对话高手',
        description: '完成100次AI对话练习',
        icon: '🤖',
        unlocked: totalAiPractice >= 100,
        progress: totalAiPractice < 100 ? { current: totalAiPractice, target: 100 } : undefined
      },
      {
        id: 'continuous_month',
        name: '坚持不懈',
        description: '连续学习30天',
        icon: '🔥',
        unlocked: continuousDays >= 30,
        progress: continuousDays < 30 ? { current: continuousDays, target: 30 } : undefined
      }
    ];

    res.json({
      code: 200,
      message: 'success',
      data: achievements
    });
  } catch (error) {
    logger.error('获取成就列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取成就列表失败',
      error: error.message
    });
  }
});

/**
 * 获取学习建议
 * GET /report/suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 获取最近的学习记录
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = await StudyRecord.find({
      userId: userid,
      date: { $gte: sevenDaysAgo }
    });

    // 计算平均数据
    const avgAccuracy = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + (r.practiceStats?.spellingAccuracy || 0), 0) / recentRecords.length
      : 0;

    const avgStudyTime = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.totalStudyTime, 0) / recentRecords.length
      : 0;

    // 根据学习数据生成建议
    const suggestions = [];

    if (avgAccuracy < 80) {
      suggestions.push({
        id: 'spelling_practice',
        type: 'spelling',
        icon: '✏️',
        title: '加强拼写练习',
        description: `您的拼写正确率为${Math.round(avgAccuracy)}%，建议多加练习以提高准确率`,
        actionUrl: '/spelling'
      });
    }

    // 检查需要复习的单词
    const reviewWordsCount = await UserWord.countDocuments({
      userId: userid,
      nextReviewTime: { $lte: new Date() }
    });

    if (reviewWordsCount > 0) {
      suggestions.push({
        id: 'vocabulary_review',
        type: 'vocabulary',
        icon: '📚',
        title: '复习已学单词',
        description: `您有${reviewWordsCount}个单词需要复习，建议今天完成复习`,
        actionUrl: '/review'
      });
    }

    if (avgStudyTime < 30) {
      suggestions.push({
        id: 'increase_study_time',
        type: 'general',
        icon: '⏱️',
        title: '增加学习时长',
        description: '建议每天至少学习30分钟，以达到更好的学习效果',
        actionUrl: '/chapters'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        suggestions
      }
    });
  } catch (error) {
    logger.error('获取学习建议失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学习建议失败',
      error: error.message
    });
  }
});

/**
 * 获取学习质量评估
 * GET /report/quality
 * 参数:
 *   - date: 日期，格式: YYYY-MM-DD，默认为今天
 *   - days: 获取趋势数据的天数，默认为7天
 */
router.get('/quality', async (req, res) => {
  try {
    const { userid } = req.session;
    if (!userid) {
      return res.status(401).json({
        code: 401,
        message: '请先登录'
      });
    }

    const { date, days = 7 } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const queryDate = date ? new Date(date) : today;

    // 获取指定天数的学习记录
    const startDate = new Date(queryDate);
    startDate.setDate(startDate.getDate() - parseInt(days) + 1);

    const records = await StudyRecord.find({
      userId: userid,
      date: {
        $gte: startDate,
        $lte: queryDate
      }
    }).sort({ date: 1 });

    // 获取用户的单词学习记录
    const userWords = await UserWord.find({ userId: userid });

    // 计算记忆维度得分
    const avgAccuracy = records.length > 0
      ? records.reduce((sum, r) => sum + (r.practiceStats?.spellingAccuracy || 0), 0) / records.length
      : 0;

    const masteredWords = userWords.filter(w => w.reviewCounts >= 3).length;
    const retentionRate = userWords.length > 0 ? (masteredWords / userWords.length) * 100 : 0;

    const memoryScore = (avgAccuracy * 0.6) + (retentionRate * 0.4);

    // 计算理解维度得分
    const avgListeningCompletion = records.length > 0
      ? records.reduce((sum, r) => sum + (r.practiceStats?.listeningCompletion || 0), 0) / records.length
      : 0;

    const understandingScore = avgListeningCompletion;

    // 计算应用维度得分
    const avgAiPracticeCount = records.length > 0
      ? records.reduce((sum, r) => sum + (r.practiceStats?.aiPracticeCount || 0), 0) / records.length
      : 0;

    const applicationScore = Math.min(avgAiPracticeCount * 10, 100);

    // 计算综合得分
    const overallScore = (memoryScore * 0.4) + (understandingScore * 0.3) + (applicationScore * 0.3);

    // 生成质量趋势数据
    const trend = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recAccuracy = record.practiceStats?.spellingAccuracy || 0;
      const recRetention = userWords.length > 0 
        ? (userWords.filter(w => w.reviewCounts >= 3 && w.lastSeenAt <= record.date).length / userWords.length) * 100
        : 0;
      const recMemoryScore = (recAccuracy * 0.6) + (recRetention * 0.4);
      const recUnderstanding = record.practiceStats?.listeningCompletion || 0;
      const recApplication = Math.min((record.practiceStats?.aiPracticeCount || 0) * 10, 100);
      const recOverall = (recMemoryScore * 0.4) + (recUnderstanding * 0.3) + (recApplication * 0.3);

      trend.push({
        date: record.date.toISOString().split('T')[0],
        overallScore: recOverall,
        memoryScore: recMemoryScore,
        understandingScore: recUnderstanding,
        applicationScore: recApplication
      });
    }

    // 生成质量改进建议
    const suggestions = [];

    if (memoryScore < 70) {
      suggestions.push({
        id: 'memory_improve',
        type: 'memory',
        icon: '🔄',
        title: '提升记忆能力',
        description: '建议使用间隔重复法复习，提高长期记忆效果',
        priority: '高',
        actionUrl: '/review'
      });
    }

    if (understandingScore < 70) {
      suggestions.push({
        id: 'understanding_improve',
        type: 'understanding',
        icon: '📖',
        title: '提升理解能力',
        description: '建议多阅读英文文章，提高在语境中理解单词的能力',
        priority: '中',
        actionUrl: '/reading'
      });
    }

    if (applicationScore < 70) {
      suggestions.push({
        id: 'application_improve',
        type: 'application',
        icon: '💬',
        title: '加强应用练习',
        description: '建议通过AI对话、造句等方式加强单词的实际应用',
        priority: '高',
        actionUrl: '/ai-chat'
      });
    }

    // 构建响应数据
    const qualityData = {
      overallScore: Math.round(overallScore),
      dimensions: {
        memory: {
          score: Math.round(memoryScore),
          level: getScoreLevel(memoryScore),
          description: getDimensionDescription('memory', memoryScore),
          metrics: {
            accuracy: Math.round(avgAccuracy),
            retention: Math.round(retentionRate)
          }
        },
        understanding: {
          score: Math.round(understandingScore),
          level: getScoreLevel(understandingScore),
          description: getDimensionDescription('understanding', understandingScore),
          metrics: {
            comprehension: Math.round(avgListeningCompletion)
          }
        },
        application: {
          score: Math.round(applicationScore),
          level: getScoreLevel(applicationScore),
          description: getDimensionDescription('application', applicationScore),
          metrics: {
            usage: Math.round(avgAiPracticeCount)
          }
        }
      },
      trend: trend,
      suggestions
    };

    res.json({
      code: 200,
      message: 'success',
      data: qualityData
    });
  } catch (error) {
    logger.error('获取学习质量评估失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学习质量评估失败',
      error: error.message
    });
  }
});

// 辅助函数：获取得分等级
function getScoreLevel(score) {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 60) return '一般';
  return '需改进';
}

// 辅助函数：获取维度描述
function getDimensionDescription(dimension, score) {
  const descriptions = {
    memory: {
      excellent: '您的单词记忆能力非常出色，能够快速掌握并长期保持',
      good: '您的单词记忆能力较好，能够较快掌握新单词',
      average: '您的单词记忆能力一般，需要加强复习',
      poor: '您的单词记忆能力需要提升，建议使用科学记忆方法'
    },
    understanding: {
      excellent: '您对单词的理解能力非常出色，能够准确把握词义和用法',
      good: '您对单词的理解能力良好，基本能够正确使用单词',
      average: '您对单词的理解能力一般，在语境应用方面还需加强',
      poor: '您对单词的理解能力需要提升，建议多阅读和练习'
    },
    application: {
      excellent: '您的单词应用能力非常出色，能够灵活运用所学单词',
      good: '您的单词应用能力良好，能够在实际场景中正确使用',
      average: '您的单词应用能力一般，还有提升空间',
      poor: '您的单词应用能力需要提升，建议多进行实际应用练习'
    }
  };

  const level = getScoreLevel(score);
  return descriptions[dimension][level] || '';
}

module.exports = router;
