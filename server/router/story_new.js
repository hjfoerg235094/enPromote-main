const express = require('express');
const router = express.Router();
const storyScenes = require('../ai/storyScenes.json');
const StoryAiService = require('../modules/StoryAiService_v2');
const { StoryProgressManager } = require('../modules/StoryProgress');
const { StoryBranchManager } = require('../modules/StoryBranch');

/**
 * 获取可用剧情列表
 */
router.get('/list', (req, res) => {
  try {
    const stories = Object.values(storyScenes).map(story => ({
      storyId: story.storyId,
      title: story.storyTitle,
      description: story.storyDescription,
      totalChapters: story.totalChapters
    }));

    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('获取剧情列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取剧情列表失败'
    });
  }
});

/**
 * 获取剧情详情
 */
router.get('/:storyId', (req, res) => {
  try {
    const { storyId } = req.params;
    const story = storyScenes[storyId];

    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    res.json({
      success: true,
      data: {
        storyId: story.storyId,
        title: story.storyTitle,
        description: story.storyDescription,
        totalChapters: story.totalChapters,
        chapters: story.chapters.map(chapter => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          scene: chapter.scene
        }))
      }
    });
  } catch (error) {
    console.error('获取剧情详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取剧情详情失败'
    });
  }
});

/**
 * AI对话 - 实时流式响应
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/dialogue', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const { message, conversationHistory } = req.body;

    // 获取任务配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    const task = chapter.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 设置 SSE 响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 调用AI服务
    const completion = await StoryAiService.dialogue(
      { 
        aiRole: chapter.aiRole,
        scene: chapter.scene,
        requiredWords: task.requiredWords
      },
      message,
      conversationHistory || []
    );

    // 流式返回AI响应
    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content || "";
      res.write(`event: delta
`);
      res.write(`data: ${JSON.stringify({ content: delta })}

`);
    }

    // 告诉前端结束
    res.write(`event: end
data: [DONE]

`);
    res.end();
  } catch (error) {
    console.error('AI对话错误:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'AI对话失败'
      });
    }
  }
});

/**
 * 生成拼写练习
 */
router.get('/:storyId/chapter/:chapterId/task/:taskId/spelling', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;

    // 获取任务配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    const task = chapter.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 调用AI服务生成拼写练习
    const spellingData = await StoryAiService.spelling(task);

    res.json({
      success: true,
      data: spellingData
    });
  } catch (error) {
    console.error('生成拼写练习错误:', error);
    res.status(500).json({
      success: false,
      message: '生成拼写练习失败'
    });
  }
});

/**
 * 生成听力材料
 */
router.get('/:storyId/chapter/:chapterId/task/:taskId/listening', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;

    // 获取任务配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    const task = chapter.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 调用AI服务生成听力材料
    const listeningData = await StoryAiService.listening(task);

    res.json({
      success: true,
      data: listeningData
    });
  } catch (error) {
    console.error('生成听力材料错误:', error);
    res.status(500).json({
      success: false,
      message: '生成听力材料失败'
    });
  }
});

/**
 * 生成阅读材料
 */
router.get('/:storyId/chapter/:chapterId/task/:taskId/reading', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;

    // 获取任务配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    const task = chapter.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 调用AI服务生成阅读材料
    const readingData = await StoryAiService.reading(task);

    res.json({
      success: true,
      data: readingData
    });
  } catch (error) {
    console.error('生成阅读材料错误:', error);
    res.status(500).json({
      success: false,
      message: '生成阅读材料失败'
    });
  }
});

/**
 * 生成个性化反馈
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/feedback', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const { score, userPerformance } = req.body;

    // 获取任务配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    const task = chapter.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 调用AI服务生成反馈
    const feedback = await StoryAiService.generateFeedback(
      task.type,
      score,
      userPerformance || {}
    );

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('生成反馈错误:', error);
    res.status(500).json({
      success: false,
      message: '生成反馈失败'
    });
  }
});

/**
 * 获取章节详情
 */
router.get('/:storyId/chapter/:chapterId', (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const story = storyScenes[storyId];

    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }

    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }

    res.json({
      success: true,
      data: {
        chapterId: chapter.chapterId,
        title: chapter.title,
        scene: chapter.scene,
        aiRole: chapter.aiRole,
        userRole: chapter.userRole,
        storyBackground: chapter.storyBackground,
        tasks: chapter.tasks,
        completionCriteria: chapter.completionCriteria,
        nextChapterHint: chapter.nextChapterHint
      }
    });
  } catch (error) {
    console.error('获取章节详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取章节详情失败'
    });
  }
});

/**
 * AI判定任务完成
 */
router.post('/:storyId/chapter/:chapterId/task/:taskId/complete', async (req, res) => {
  try {
    const { storyId, chapterId, taskId } = req.params;
    const userId = req.user?.id; // 从认证中间件获取用户ID
    const taskData = req.body;
    
    // 获取任务配置
    const story = storyScenes[storyId];
    if (!story) {
      return res.status(404).json({
        success: false,
        message: '剧情不存在'
      });
    }
    
    const chapter = story.chapters.find(ch => ch.chapterId === parseInt(chapterId));
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: '章节不存在'
      });
    }
    
    const task = chapter.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    // 根据任务类型进行AI判定
    let feedback = null;
    
    switch (task.type) {
      case 'dialogue':
        feedback = await evaluateDialogueTask(task, taskData);
        break;
      case 'spelling':
        feedback = await evaluateSpellingTask(task, taskData);
        break;
      case 'listening':
        feedback = await evaluateListeningTask(task, taskData);
        break;
      case 'reading':
        feedback = await evaluateReadingTask(task, taskData);
        break;
      default:
        feedback = {
          score: 0,
          maxScore: 100,
          isCompleted: false,
          message: '未知的任务类型',
          improvements: []
        };
    }
    
    // 如果用户做出了选择，保存选择并确定下一章
    let nextChapterInfo = null;
    if (taskData.choiceId && feedback.isCompleted) {
      // 保存用户选择
      const choiceData = {
        choiceId: taskData.choiceId,
        choiceText: taskData.choiceText,
        impact: taskData.choiceImpact,
        timestamp: new Date()
      };

      await StoryProgressManager.saveKeyChoice(
        userId,
        storyId,
        parseInt(chapterId),
        parseInt(taskId),
        choiceData
      );

      // 根据用户选择和表现确定下一章
      const performance = {
        score: feedback.score,
        style: analyzeTaskApproach(taskData),
        vocabularyLevel: analyzeVocabularyLevel(taskData.wordsUsed)
      };

      nextChapterInfo = await StoryBranchManager.determineNextChapter(
        userId,
        storyId,
        parseInt(chapterId),
        parseInt(taskId),
        taskData.choiceId,
        performance
      );
    }

    res.json({
      success: true,
      data: {
        feedback,
        isCompleted: feedback.score >= 60,
        nextChapterInfo,
        hasChoices: task.keyChoices && task.keyChoices.length > 0
      }
    });
  } catch (error) {
    console.error('AI判定任务失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI判定任务失败'
    });
  }
});

/**
 * AI判定对话任务
 */
async function evaluateDialogueTask(task, taskData) {
  // 检查使用的单词
  const usedWords = taskData.wordsUsed || [];
  const requiredWords = task.requiredWords || [];
  const matchedWords = usedWords.filter(word => requiredWords.includes(word));
  
  // 单词使用得分 (40分)
  const wordScore = Math.min((matchedWords.length / Math.max(task.minWords, 1)) * 40, 40);
  
  // 对话轮次得分 (30分)
  const turns = taskData.turns || 0;
  const turnScore = Math.min((turns / (task.completionCriteria?.minTurns || 4)) * 30, 30);
  
  // 表达质量得分 (30分满分) - 限制不超过30分
  const qualityScore = Math.min(taskData.qualityScore || 30, 30);
  
  const totalScore = wordScore + turnScore + qualityScore;
  
  // 生成反馈
  const missedWords = requiredWords.filter(word => !usedWords.includes(word));
  const improvements = [];
  
  if (missedWords.length > 0) {
    improvements.push(`建议尝试使用这些单词: ${missedWords.join(', ')}`);
  }
  
  if (turns < (task.completionCriteria?.minTurns || 4)) {
    improvements.push('对话轮次较少，可以多交流几次');
  }
  
  return {
    score: Math.round(totalScore),
    maxScore: 100,
    isCompleted: totalScore >= 60,
    message: totalScore >= 60 ? '太棒了！你的对话表现很棒，单词使用也很准确！' : '继续努力！多练习对话，尝试使用更多目标单词。',
    improvements
  };
}

/**
 * AI判定拼写任务
 */
async function evaluateSpellingTask(task, taskData) {
  const correctRate = taskData.correctRate || 0;
  // 前端已经传入了百分比(0-100),直接使用即可
  const score = Math.min(correctRate, 100);
  
  const improvements = [];
  
  if (score < 80) {
    improvements.push('注意单词的大小写和拼写规则');
  }
  
  if (score < 60) {
    improvements.push('多练习几次，注意常见拼写错误');
  }
  
  return {
    score: Math.round(score),
    maxScore: 100,
    isCompleted: score >= 60,
    message: score >= 80 ? '拼写正确！继续保持！' : '有些单词拼写不太准确，多练习几次！',
    improvements
  };
}

/**
 * AI判定听力任务
 */
async function evaluateListeningTask(task, taskData) {
  const correctAnswers = taskData.correctAnswers || 0;
  const totalQuestions = taskData.totalQuestions || 3;
  const score = (correctAnswers / totalQuestions) * 100;
  
  const improvements = [];
  
  if (score < 80) {
    improvements.push('注意听关键词和上下文');
  }
  
  if (score < 60) {
    improvements.push('多听几次，提高听力理解能力');
  }
  
  return {
    score: Math.round(score),
    maxScore: 100,
    isCompleted: score >= 60,
    message: score >= 80 ? '听力理解很棒！' : '听力还需要加强，多听几次！',
    improvements
  };
}

/**
 * AI判定阅读任务
 */
async function evaluateReadingTask(task, taskData) {
  const correctAnswers = taskData.correctAnswers || 0;
  const totalQuestions = taskData.totalQuestions || 3;
  const score = (correctAnswers / totalQuestions) * 100;
  
  const improvements = [];
  
  if (score < 80) {
    improvements.push('注意理解文章的主旨和细节');
  }
  
  if (score < 60) {
    improvements.push('多读几遍，提高阅读理解能力');
  }
  
  return {
    score: Math.round(score),
    maxScore: 100,
    isCompleted: score >= 60,
    message: score >= 80 ? '阅读理解能力很好！' : '阅读理解需要加强，多读几遍！',
    improvements
  };
}

/**
 * 分析任务方式
 */
function analyzeTaskApproach(taskData) {
  const turns = taskData.turns || 0;
  const timeSpent = taskData.timeSpent || 0;
  
  // 根据对话轮次和用时判断任务方式
  if (turns >= 8 && timeSpent > 300) {
    return 'careful'; // 谨慎：多轮对话，用时较长
  } else if (turns <= 4 && timeSpent < 180) {
    return 'aggressive'; // 激进：少轮对话，快速完成
  }
  return 'balanced'; // 平衡：介于两者之间
}

/**
 * 分析词汇水平
 */
function analyzeVocabularyLevel(wordsUsed) {
  if (!wordsUsed || wordsUsed.length === 0) {
    return 'basic';
  }

  // 简单的词汇复杂度分析
  const avgLength = wordsUsed.reduce((sum, word) => sum + word.length, 0) / wordsUsed.length;
  
  if (avgLength >= 7) {
    return 'advanced'; // 高级：平均词长较长
  } else if (avgLength >= 5) {
    return 'intermediate'; // 中级：平均词长中等
  }
  return 'basic'; // 基础：平均词长较短
}

module.exports = router;
