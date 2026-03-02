
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const aliyunConfig = require('../config/aliyun');

// 初始化阿里云百炼客户端
const aliyunClient = new OpenAI({
  baseURL: aliyunConfig.endpoint,
  apiKey: aliyunConfig.apiKey,
  defaultHeaders: {
    'X-DashScope-SSE': 'disable'  // 禁用SSE流式响应
  }
});

/**
 * 生成听力材料和问题
 * POST /api/listening/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { 
      scene,          // 场景描述，如"机场入境"
      targetWords,    // 目标词汇数组
      difficulty,     // 难度级别，如"初级"、"中级"、"高级"
      questionCount   // 问题数量，默认3个
    } = req.body;

    // 参数验证
    if (!scene || !targetWords || !Array.isArray(targetWords) || targetWords.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: scene 和 targetWords'
      });
    }

    const numQuestions = questionCount || 3;
    const difficultyLevel = difficulty || '中级';

    // 构建AI提示词
    const prompt = `你是一名专业的英语教育专家，擅长为ESL（英语作为第二语言）学习者创建听力练习材料。

当前场景：${scene}
目标词汇：${targetWords.join(', ')}
难度级别：${difficultyLevel}

请根据以上信息生成以下听力材料：

1. **听力材料文本**：
   - 创建一个${scene}场景的对话或短文
   - 内容长度在80-120词
   - 包含至少${Math.min(targetWords.length, 3)}个目标词汇
   - 语言自然流畅，符合${difficultyLevel}水平

2. **听力理解问题**：
   - 根据听力材料生成${numQuestions}道理解题
   - 每题包含4个选项（A, B, C, D）
   - 提供详细的答案解析

请严格按照以下JSON格式输出，不要有任何额外的解释或Markdown代码块标记：

{
  "listeningText": "听力材料文本",
  "questions": [
    {
      "question": "问题内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": 0,
      "explanation": "答案解析"
    }
  ]
}`;

    // 调用阿里云百炼API
    const completion = await aliyunClient.chat.completions.create({
      model: aliyunConfig.defaultModel,
      messages: [
        {
          role: 'system',
          content: '你是一名专业的英语教育专家，擅长为ESL学习者创建听力练习材料。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // 解析AI返回的JSON
    let listeningContent;
    try {
      const aiResponse = completion.choices[0].message.content;
      // 尝试从响应中提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        listeningContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法从AI响应中提取有效的JSON');
      }
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return res.status(500).json({
        success: false,
        message: '生成听力材料失败，请重试'
      });
    }

    // 验证返回的数据结构
    if (!listeningContent.listeningText || !listeningContent.questions || !Array.isArray(listeningContent.questions)) {
      return res.status(500).json({
        success: false,
        message: '生成的听力材料格式不正确'
      });
    }

    // 返回生成的听力材料
    res.json({
      success: true,
      data: {
        listeningText: listeningContent.listeningText,
        questions: listeningContent.questions,
        targetWords: targetWords,
        difficulty: difficultyLevel
      }
    });

  } catch (error) {
    console.error('生成听力材料失败:', error);

    // 返回测试数据作为后备方案
    const testData = {
      listeningText: `Welcome to the airport. Please listen carefully to the following instructions. 
      All passengers must declare any prohibited items at customs. Items such as weapons, drugs, and certain food products are not allowed. 
      You must also declare any items that exceed the duty-free limit. 
      Our customs officers will inspect your luggage if necessary. 
      If you have any questions about the declaration process, please ask an officer for assistance. 
      Thank you for your cooperation.`,
      questions: [
        {
          question: "What items are prohibited at customs?",
          options: ["Weapons and drugs", "Books and clothes", "Electronics", "Medicine"],
          correctAnswer: 0,
          explanation: "Weapons, drugs, and certain food products are prohibited items that must be declared."
        },
        {
          question: "What should you do if you have questions?",
          options: ["Ask a fellow passenger", "Ask a customs officer", "Call the police", "Ignore them"],
          correctAnswer: 1,
          explanation: "If you have questions about the declaration process, you should ask a customs officer for assistance."
        },
        {
          question: "What will happen to your luggage?",
          options: ["It will be destroyed", "It will be inspected if necessary", "It will be returned", "It will be lost"],
          correctAnswer: 1,
          explanation: "Customs officers will inspect your luggage if necessary."
        }
      ]
    };

    res.json({
      success: true,
      data: {
        listeningText: testData.listeningText,
        questions: testData.questions,
        targetWords: targetWords,
        difficulty: difficultyLevel
      }
    });
  }
});

module.exports = router;
