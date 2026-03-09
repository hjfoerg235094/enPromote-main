
/**
 * 学习质量评估API
 * 需要将此文件的内容添加到 report_new.js 中
 */

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
