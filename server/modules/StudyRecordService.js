
const StudyRecord = require('./StudyRecord');
const UserWord = require('./UserWord');

class StudyRecordService {
  /**
   * 记录学习活动
   * @param {String} userId - 用户ID
   * @param {String} module - 学习模块 ('vocabulary', 'listening', 'spelling', 'aiPractice')
   * @param {Object} data - 学习数据
   */
  async recordStudyActivity(userId, module, data) {
    try {
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
      const studyTime = data.studyTime || 0;
      record.totalStudyTime += studyTime;
      record.moduleStudyTime[module] += studyTime;

      // 更新单词学习统计
      if (data.newWords) {
        record.wordsLearned.newWords += data.newWords;
      }
      if (data.reviewWords) {
        record.wordsLearned.reviewWords += data.reviewWords;
      }

      // 更新练习统计
      if (data.accuracy !== undefined) {
        const currentAccuracy = record.practiceStats.spellingAccuracy;
        const totalSessions = record.sessions.filter(s => s.module === module).length;
        record.practiceStats.spellingAccuracy = totalSessions > 0
          ? (currentAccuracy * totalSessions + data.accuracy) / (totalSessions + 1)
          : data.accuracy;
      }

      if (module === 'aiPractice') {
        record.practiceStats.aiPracticeCount += 1;
      }

      // 记录学习会话
      record.sessions.push({
        startTime: data.startTime || new Date(),
        endTime: data.endTime || new Date(),
        module,
        wordsCount: data.wordsCount || 0,
        accuracy: data.accuracy || 0
      });

      // 计算效率指标
      const totalWords = record.wordsLearned.newWords + record.wordsLearned.reviewWords;
      record.efficiency.wordsPerMinute = record.totalStudyTime > 0
        ? totalWords / record.totalStudyTime
        : 0;

      // 计算掌握率（基于复习次数）
      const userWords = await UserWord.find({ userId });
      const masteredWords = userWords.filter(w => w.reviewCounts >= 3).length;
      record.efficiency.masteryRate = userWords.length > 0
        ? masteredWords / userWords.length
        : 0;

      // 计算掌握速度
      record.efficiency.masterySpeed = record.totalStudyTime > 0
        ? record.efficiency.masteryRate / (record.totalStudyTime / 60)
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
