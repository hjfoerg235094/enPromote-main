
const StudyRecord = require('./StudyRecord');
const UserWord = require('./UserWord');

const roundNumber = (value, precision = 2) => {
  const number = Number(value) || 0;
  return Number(number.toFixed(precision));
};

const normalizeStudyModule = (module) => {
  if (module === 'review') return 'vocabulary';
  return module;
};

const ALLOWED_MODULES = new Set(['vocabulary', 'listening', 'spelling', 'aiPractice']);

const getWeightedSessionAccuracy = (sessions, module) => {
  const moduleSessions = sessions.filter(s => s.module === module && typeof s.accuracy === 'number');
  const totalWords = moduleSessions.reduce((sum, s) => sum + (s.wordsCount || 0), 0);

  if (totalWords > 0) {
    const weightedAccuracy = moduleSessions.reduce((sum, s) => {
      return sum + ((s.accuracy || 0) * (s.wordsCount || 0));
    }, 0);
    return weightedAccuracy / totalWords;
  }

  if (moduleSessions.length === 0) return 0;
  return moduleSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / moduleSessions.length;
};

class StudyRecordService {
  /**
   * 记录学习活动
   * @param {String} userId - 用户ID
   * @param {String} module - 学习模块 ('vocabulary', 'listening', 'spelling', 'aiPractice')
   * @param {Object} data - 学习数据
   */
  async recordStudyActivity(userId, module, data) {
    try {
      const normalizedModule = normalizeStudyModule(module);
      if (!ALLOWED_MODULES.has(normalizedModule)) {
        throw new Error(`Unsupported study module: ${module}`);
      }

      // 使用学习开始时间来确定记录的日期
      const studyDate = data.startTime ? new Date(data.startTime) : new Date();
      const today = new Date(studyDate);
      today.setHours(0, 0, 0, 0);

      // 查找或创建当天的学习记录
      let record = await StudyRecord.findOne({
        userId,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!record) {
        record = new StudyRecord({
          userId,
          date: today,
          totalStudyTime: 0,
          moduleStudyTime: {
            vocabulary: 0,
            listening: 0,
            spelling: 0,
            aiPractice: 0
          },
          wordsLearned: {
            newWords: 0,
            reviewWords: 0
          },
          practiceStats: {
            spellingAccuracy: 0,
            listeningCompletion: 0,
            aiPracticeCount: 0
          },
          efficiency: {
            wordsPerMinute: 0,
            masteryRate: 0,
            masterySpeed: 0
          },
          sessions: []
        });
      }

      // 更新学习时长
      const studyTime = Math.max(0, roundNumber(data.studyTime));
      record.totalStudyTime += studyTime;
      record.moduleStudyTime[normalizedModule] += studyTime;

      // 更新单词学习统计
      if (data.newWords) {
        record.wordsLearned.newWords += data.newWords;
      }
      if (data.reviewWords) {
        record.wordsLearned.reviewWords += data.reviewWords;
      }

      // 更新练习统计：词汇辨认的 accuracy 只进 sessions，不写入 spellingAccuracy。
      if (normalizedModule === 'spelling' && data.accuracy !== undefined) {
        const nextSessions = [
          ...record.sessions,
          {
            module: normalizedModule,
            wordsCount: data.wordsCount || 0,
            accuracy: data.accuracy || 0
          }
        ];
        record.practiceStats.spellingAccuracy = roundNumber(getWeightedSessionAccuracy(nextSessions, 'spelling'));
      } else if (normalizedModule === 'listening' && data.accuracy !== undefined) {
        const nextSessions = [
          ...record.sessions,
          {
            module: normalizedModule,
            wordsCount: data.wordsCount || 0,
            accuracy: data.accuracy || 0
          }
        ];
        record.practiceStats.listeningCompletion = roundNumber(getWeightedSessionAccuracy(nextSessions, 'listening'));
      } else if (normalizedModule === 'aiPractice') {
        record.practiceStats.aiPracticeCount += 1;
      }

      // 记录学习会话
      record.sessions.push({
        startTime: data.startTime || new Date(),
        endTime: data.endTime || new Date(),
        module: normalizedModule,
        wordsCount: data.wordsCount || 0,
        accuracy: data.accuracy || 0
      });

      // 计算效率指标
      const totalWords = record.wordsLearned.newWords + record.wordsLearned.reviewWords;
      record.efficiency.wordsPerMinute = record.totalStudyTime > 0
        ? roundNumber(totalWords / record.totalStudyTime)
        : 0;

      // 计算掌握率：优先使用明确掌握状态，兼容旧的 reviewCounts>=3 规则。
      const userWords = await UserWord.find({ userId });
      const masteredWords = userWords.filter(w => {
        return ['know', 'mastered'].includes(w.status) || w.reviewCounts >= 3;
      }).length;
      record.efficiency.masteryRate = userWords.length > 0
        ? roundNumber(masteredWords / userWords.length)
        : 0;

      // 掌握速度：每分钟稳定掌握的词量。
      record.efficiency.masterySpeed = record.totalStudyTime > 0
        ? roundNumber(record.efficiency.wordsPerMinute * record.efficiency.masteryRate, 3)
        : 0;

      await record.save();
      return record;
    } catch (error) {
      console.error('记录学习活动失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的学习记录
   * @param {String} userId - 用户ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   */
  async getUserStudyRecords(userId, startDate, endDate) {
    try {
      return await StudyRecord.find({
        userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ date: 1 });
    } catch (error) {
      console.error('获取学习记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户某天的学习记录
   * @param {String} userId - 用户ID
   * @param {Date} date - 日期
   */
  async getUserDailyRecord(userId, date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      return await StudyRecord.findOne({
        userId,
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
    } catch (error) {
      console.error('获取每日学习记录失败:', error);
      throw error;
    }
  }
}

module.exports = new StudyRecordService();
