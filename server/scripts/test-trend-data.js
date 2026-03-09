/**
 * 测试数据脚本 - 创建模拟学习记录用于测试趋势图表
 * 使用方法：node scripts/test-trend-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StudyRecord = require('../modules/StudyRecord');

async function createTestData() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/EnglishMastery');
    console.log('数据库连接成功');

    // 测试用户 ID（需要替换为实际登录用户的 ID）
    const testUserId = 'test-user-001';

    // 生成最近 7 天的测试数据
    const records = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const studyTime = Math.floor(Math.random() * 60) + 20; // 20-80 分钟
      const newWords = Math.floor(Math.random() * 20) + 5; // 5-25 个新单词
      const reviewWords = Math.floor(Math.random() * 30) + 10; // 10-40 个复习单词
      const wordsPerMinute = studyTime > 0 ? ((newWords + reviewWords) / studyTime).toFixed(2) : 0;
      const masteryRate = Math.random() * 0.3 + 0.6; // 0.6-0.9
      const masterySpeed = Math.random() * 0.005 + 0.001; // 0.001-0.006

      records.push({
        userId: testUserId,
        date: date,
        totalStudyTime: studyTime,
        moduleStudyTime: {
          vocabulary: Math.floor(studyTime * 0.4),
          listening: Math.floor(studyTime * 0.3),
          spelling: Math.floor(studyTime * 0.2),
          aiPractice: Math.floor(studyTime * 0.1)
        },
        wordsLearned: {
          newWords: newWords,
          reviewWords: reviewWords
        },
        practiceStats: {
          spellingAccuracy: Math.floor(Math.random() * 20) + 75, // 75-95%
          listeningCompletion: Math.floor(Math.random() * 20) + 70, // 70-90%
          aiPracticeCount: Math.floor(Math.random() * 5) + 1 // 1-5 次
        },
        efficiency: {
          wordsPerMinute: parseFloat(wordsPerMinute),
          masteryRate: masteryRate,
          masterySpeed: masterySpeed
        }
      });
    }

    // 删除旧的测试数据
    await StudyRecord.deleteMany({ userId: testUserId });
    console.log('已清除旧的测试数据');

    // 插入新数据
    const result = await StudyRecord.insertMany(records);
    console.log(`成功创建 ${result.length} 条测试记录`);

    // 显示创建的数据
    console.log('\n测试数据概览:');
    result.forEach(record => {
      console.log(`  ${record.date.toISOString().split('T')[0]}: ${record.totalStudyTime}分钟, ${record.wordsLearned.newWords + record.wordsLearned.reviewWords}单词, ${record.efficiency.wordsPerMinute}词/分钟`);
    });

    console.log('\n测试数据创建完成！');
    console.log(`测试用户 ID: ${testUserId}`);
    console.log('请在测试时使用此用户 ID 登录');

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}

createTestData();
