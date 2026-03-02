const express = require('express');
const router = express.Router();
const { Question, QUESTION_TYPES, DIFFICULTY_LEVELS } = require('../modules/Question');
const UserWord = require('../modules/UserWord');
const Word = require('../modules/Word');
const User = require('../modules/User');
const { OpenAI } = require('openai');
const { apiKey, baseUrl } = require('../config/serve');
const aliyunConfig = require('../config/aliyun');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

// 题目去重辅助函数 - 生成题目内容的哈希值
function generateQuestionHash(question) {
  // 标准化题目内容：移除多余空格、标点等
  const normalized = question
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim();
  
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// 检查题目是否重复
async function isQuestionDuplicate(userId, chapter, level, questionContent) {
  const hash = generateQuestionHash(questionContent);
  
  // 查找相同哈希值的题目
  const existingQuestion = await Question.findOne({
    userId,
    chapter,
    level,
    questionHash: hash
  });
  
  return !!existingQuestion;
}

// 验证和修正correctAnswer格式
function validateAndFixCorrectAnswer(correctAnswer, options) {
  if (!correctAnswer) return correctAnswer;
  
  // 如果已经是单个大写字母，直接返回
  if (/^[A-D]$/.test(correctAnswer.trim())) {
    return correctAnswer.trim();
  }
  
  // 如果correctAnswer包含选项内容，尝试从options中匹配
  if (options && Array.isArray(options)) {
    // 尝试从correctAnswer中提取字母
    const letterMatch = correctAnswer.match(/^([A-D])/i);
    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }
    
    // 尝试根据选项内容匹配
    const normalizedAnswer = correctAnswer.toLowerCase().trim();
    for (const option of options) {
      if (option.content && option.content.toLowerCase().includes(normalizedAnswer)) {
        return option.key;
      }
    }
  }
  
  // 如果无法修正，返回原值（会在后续处理中记录警告）
  return correctAnswer;
}

// DeepSeek AI客户端
const deepseekClient = new OpenAI({
  baseURL: baseUrl,
  apiKey
});

// 阿里云百炼客户端
const aliyunClient = new OpenAI({
  baseURL: aliyunConfig.endpoint,
  apiKey: aliyunConfig.apiKey,
  defaultHeaders: {
    'X-DashScope-SSE': 'disable'  // 禁用SSE流式响应
  }
});

// 第四关AI生成题目提示词模板
const LEVEL_4_PROMPT_TEMPLATE = (chapter, scenario, wordList) => `你是一名专业的英语教育专家，擅长为ESL（英语作为第二语言）学习者创建${scenario}场景的练习材料。

当前关卡：第四关（情景对话）
场景：${scenario}
已学词汇：${wordList.map(w => w.word).join(', ')}

**重要要求**：
- 每次生成题目时，必须创建全新的、不同的题目内容
- 避免使用固定的模板和常见的套路
- 题目要体现真实、自然的${scenario}场景
- 对话要有多样化的情境和人物角色
- 确保每道题目都有独特性和创新性

**【关键】关于正确答案格式的特别说明**：
所有选择题类型（包括选择题、情景对话题、听力理解题）的correctAnswer字段必须且只能是一个大写字母（A、B、C或D），绝对不能是选项的完整内容！例如：
- 正确：correctAnswer: "A"
- 错误：correctAnswer: "选项A的内容" 或 correctAnswer: "A. 选项A的内容"

请务必遵守此格式要求，否则会导致答案判断错误！

请根据以上信息生成以下类型的题目（从以下类型中随机选择3-5种类型生成）：

1. **选择题**（2道）：
   - 考察词汇在${scenario}场景中的运用
   - 难度适中，符合第四关水平
   - 每题包含4个选项（A, B, C, D）
   - 提供详细的答案解析
   - 题目场景要多样化，避免重复

2. **填空题**（2道）：
   - 创建${scenario}场景的对话或短文
   - 挖空已学词汇中的2个单词
   - 每个空提供4个备选词
   - 确保填空处的单词来自已学词汇列表
   - 对话情境要新颖独特

3. **情景对话题**（1道）：
   - 创建一个${scenario}场景的对话
   - 对话长度在100-150词
   - 对话中至少包含3个已学词汇
   - 根据对话内容生成1道理解题
   - 对话要有明确的故事情节和人物互动
   - 避免使用常见对话模板

4. **听力理解题**（1道）：
   - 创建一个${scenario}场景的对话或短文
   - 内容长度在80-120词
   - 包含至少3个已学词汇
   - 根据内容生成2-3道理解题
   - 每题包含4个选项（A, B, C, D）
   - 提供详细的答案解析

5. **完形填空题**（1道）：
   - 创建一个${scenario}场景的短文
   - 文章长度在100-150词
   - 挖空5个空，每个空提供4个备选词
   - 确保挖空处包含已学词汇
   - 提供完整的答案解析

6. **翻译题**（1道）：
   - 创建一个包含2-3个已学词汇的英语句子
   - 句子要体现${scenario}场景
   - 提供正确的中文翻译
   - 提供翻译技巧说明

7. **写作题**（1道）：
   - 设定一个${scenario}场景的写作任务
   - 要求使用至少3个已学词汇
   - 提供写作要求和评分标准
   - 提供范文示例

8. **判断题**（2道）：
   - 创建${scenario}场景的陈述句
   - 陈述内容与${scenario}场景相关
   - 包含至少1个已学词汇
   - 提供正确答案（true或false）
   - 提供详细的答案解析
   - 确保陈述内容清晰明确

请严格按照以下JSON格式输出，不要有任何额外的解释或Markdown代码块标记：

{
  "multiple_choice": [
    {
      "question": "题目内容",
      "options": [
        {"key": "A", "content": "选项A内容"},
        {"key": "B", "content": "选项B内容"},
        {"key": "C", "content": "选项C内容"},
        {"key": "D", "content": "选项D内容"}
      ],
      "correctAnswer": "正确选项的字母（必须是A、B、C或D中的一个）",
      "explanation": "答案解析",
      "relatedWords": ["相关单词1", "相关单词2"]
    }
  ],
  "fill_in_blank": [
    {
      "context": "包含挖空的对话或短文",
      "blanks": [
        {
          "position": "挖空位置描述",
          "answer": "正确答案",
          "options": ["选项1", "选项2", "选项3", "选项4"],
          "explanation": "答案解析"
        }
      ]
    }
  ],
  "scenario_dialogue": {
    "dialogue": "完整的对话文本",
    "question": "理解题问题",
    "options": [
      {"key": "A", "content": "选项A"},
      {"key": "B", "content": "选项B"},
      {"key": "C", "content": "选项C"},
      {"key": "D", "content": "选项D"}
    ],
    "correctAnswer": "正确选项的字母（必须是A、B、C或D中的一个）",
    "explanation": "答案解析",
    "relatedWords": ["对话中使用的相关词汇"]
  },
  "listening_comprehension": [
    {
      "content": "听力材料文本",
      "questions": [
        {
          "question": "理解题问题",
          "options": [
            {"key": "A", "content": "选项A"},
            {"key": "B", "content": "选项B"},
            {"key": "C", "content": "选项C"},
            {"key": "D", "content": "选项D"}
          ],
          "correctAnswer": "正确选项的字母（必须是A、B、C或D中的一个）",
          "explanation": "答案解析"
        }
      ],
      "relatedWords": ["相关单词1", "相关单词2"]
    }
  ],
  "cloze_test": [
    {
      "content": "完形填空短文",
      "blanks": [
        {
          "position": "挖空位置",
          "answer": "正确答案",
          "options": ["选项1", "选项2", "选项3", "选项4"],
          "explanation": "答案解析"
        }
      ],
      "relatedWords": ["相关单词1", "相关单词2"]
    }
  ],
  "translation": [
    {
      "english": "英语句子",
      "chinese": "中文翻译",
      "tips": "翻译技巧说明",
      "relatedWords": ["相关单词1", "相关单词2"]
    }
  ],
  "writing": [
    {
      "task": "写作任务描述",
      "requirements": "写作要求",
      "gradingCriteria": "评分标准",
      "sampleAnswer": "范文示例",
      "relatedWords": ["相关单词1", "相关单词2"]
    }
  ],
  "true_false": [
    {
      "statement": "判断题陈述内容",
      "correctAnswer": "true或false",
      "explanation": "答案解析",
      "relatedWords": ["相关单词1", "相关单词2"]
    }
  ]
}`;

// 生成第四关题目
router.post('/generate', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { chapter = 'A', level = 4, aiProvider = 'deepseek' } = req.body;

    // 验证AI提供商
    if (!['deepseek', 'aliyun'].includes(aiProvider)) {
      return res.json({
        code: 400,
        message: '无效的AI提供商，请选择 deepseek 或 aliyun'
      });
    }

    // 获取用户信息
    const user = await User.findById(userid);
    if (!user) {
      return res.json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 获取用户已学词汇（优先级最高的10个单词）
    const userWords = await UserWord
      .find({ userId: userid })
      .sort({ priority: -1 })
      .limit(10);

    if (userWords.length === 0) {
      return res.json({
        code: 400,
        message: '请先学习一些单词再进行练习'
      });
    }

    // 获取单词详细信息
    const wordList = await Promise.all(userWords.map(async (userWord) => {
      const word = await Word.findById(userWord.wordId);
      if (!word) return null;
      return {
        wordId: word._id.toString(),
        word: word.word,
        meaning: word.chineseMeaning || word.meanings?.[0]?.definitions?.[0]?.definition || ''
      };
    }));

    const validWordList = wordList.filter(w => w !== null);

    // 获取章节场景信息
    const chapterConfig = require('../config/chapters').CHAPTERS[chapter];
    if (!chapterConfig) {
      return res.json({
        code: 400,
        message: '无效的章节'
      });
    }

    const scenario = chapterConfig.name || '酒店场景';

    // 构建AI提示词
    const prompt = LEVEL_4_PROMPT_TEMPLATE(chapter, scenario, validWordList);

    logger.info(`生成第四关题目 - 用户: ${userid}, 章节: ${chapter}, 单词数: ${validWordList.length}, AI提供商: ${aiProvider}`);

    // 根据提供商选择AI客户端和模型
    const client = aiProvider === 'aliyun' ? aliyunClient : deepseekClient;
    const model = aiProvider === 'aliyun' ? aliyunConfig.defaultModel : 'deepseek-chat';

    // 调用AI生成题目
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: prompt }
      ],
      model: model,
      stream: false,
      max_tokens: 4096,  // 限制最大token数，避免生成过长内容
      temperature: 0.6,  // 控制随机性，0.0-1.0之间，值越高越随机（降低以提高稳定性）
      top_p: 0.9,       // 控制多样性，0.0-1.0之间
      presence_penalty: 0.3,  // 鼓励话题多样性
      frequency_penalty: 0.3  // 减少重复内容
    });

    let aiResponse = completion.choices[0].message.content;

    // 清理AI返回的内容
    if (aiResponse.includes('```json')) {
      aiResponse = aiResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (aiResponse.includes('```')) {
      aiResponse = aiResponse.replace(/```\s*/g, '');
    }
    aiResponse = aiResponse.trim();

    logger.info(`AI生成的题目: ${aiResponse}`);

    // 解析AI返回的JSON，带重试机制
    let generatedQuestions;
    let parseSuccess = false;
    let lastParseError = null;
    const maxRetries = 3;
    
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
      try {
        // 每次重试前都清理内容
        let cleanedResponse = aiResponse.trim();
        
        // 尝试多种清理方式
        if (cleanedResponse.includes('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (cleanedResponse.includes('```')) {
          cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
        }
        
        // 移除可能的前导和尾随空白字符
        cleanedResponse = cleanedResponse.trim();
        
        // 尝试找到JSON对象的开始和结束
        const firstBrace = cleanedResponse.indexOf('{');
        const lastBrace = cleanedResponse.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
        }
        
        generatedQuestions = JSON.parse(cleanedResponse);
        parseSuccess = true;
        logger.info(`JSON解析成功，尝试次数: ${retryCount + 1}`);
        break;
      } catch (parseError) {
        lastParseError = parseError;
        logger.warn(`JSON解析失败（第${retryCount + 1}次尝试）: ${parseError.message}`);
        
        // 如果不是最后一次重试，等待一小段时间后重试
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!parseSuccess) {
      logger.error(`JSON解析彻底失败，原始内容: ${aiResponse.substring(0, 500)}...`);
      return res.json({
        code: 500,
        message: 'AI返回内容格式错误，无法解析JSON，已尝试多次重试'
      });
    }

    // 保存题目到数据库，带去重和回滚机制
    const savedQuestions = [];
    const savedQuestionIds = [];
    let hasError = false;
    let errorMessage = '';

    try {
      // 保存选择题到数据库
      if (generatedQuestions.multiple_choice && Array.isArray(generatedQuestions.multiple_choice)) {
        for (const mc of generatedQuestions.multiple_choice) {
          // 检查题目是否重复
          const isDuplicate = await isQuestionDuplicate(userid, chapter, level, mc.question);
          if (isDuplicate) {
            logger.warn(`跳过重复的选择题: ${mc.question.substring(0, 50)}...`);
            continue;
          }

          // 构建relatedWords，包含wordId
          const relatedWords = (mc.relatedWords || []).map(w => {
            const wordInfo = validWordList.find(vw => vw.word === w);
            return {
              wordId: wordInfo?.wordId || '',
              word: w,
              meaning: wordInfo?.meaning || ''
            };
          });

          // 验证和修正correctAnswer格式
          const validatedCorrectAnswer = validateAndFixCorrectAnswer(mc.correctAnswer, mc.options);
          
          // 如果correctAnswer格式不正确，记录警告
          if (validatedCorrectAnswer !== mc.correctAnswer) {
            logger.warn(`选择题correctAnswer格式已修正: 原值="${mc.correctAnswer}" -> 修正值="${validatedCorrectAnswer}"`);
          }

          const question = new Question({
            userId: userid,
            chapter: chapter,
            level: level,
            questionType: QUESTION_TYPES.MULTIPLE_CHOICE,
            difficulty: DIFFICULTY_LEVELS.MEDIUM,
            question: mc.question,
            questionHash: generateQuestionHash(mc.question),
            options: mc.options,
            correctAnswer: validatedCorrectAnswer,
            explanation: mc.explanation,
          });
          
          if (relatedWords.length > 0) {
            question.relatedWords = relatedWords;
          }
          
          await question.save();
          savedQuestions.push(question);
          savedQuestionIds.push(question._id);
        }
      }

      // 保存填空题到数据库
      if (generatedQuestions.fill_in_blank && Array.isArray(generatedQuestions.fill_in_blank)) {
        for (const fb of generatedQuestions.fill_in_blank) {
          for (const blank of fb.blanks) {
            // 检查题目是否重复
            const isDuplicate = await isQuestionDuplicate(userid, chapter, level, fb.context);
            if (isDuplicate) {
              logger.warn(`跳过重复的填空题: ${fb.context.substring(0, 50)}...`);
              continue;
            }

            // 构建relatedWords，包含wordId
            const wordInfo = validWordList.find(vw => vw.word === blank.answer);
            const relatedWords = [{
              wordId: wordInfo?.wordId || '',
              word: blank.answer,
              meaning: wordInfo?.meaning || ''
            }];

            const question = new Question({
              userId: userid,
              chapter: chapter,
              level: level,
              questionType: QUESTION_TYPES.FILL_IN_BLANK,
              difficulty: DIFFICULTY_LEVELS.MEDIUM,
              question: fb.context,
              questionHash: generateQuestionHash(fb.context),
              options: blank.options.map((opt, idx) => ({
                key: String.fromCharCode(65 + idx),
                content: opt
              })),
              correctAnswer: blank.answer,
              explanation: blank.explanation,
            });
            
            if (relatedWords.length > 0) {
              question.relatedWords = relatedWords;
            }
            
            await question.save();
            savedQuestions.push(question);
            savedQuestionIds.push(question._id);
          }
        }
      }

      // 保存情景对话题到数据库
      if (generatedQuestions.scenario_dialogue) {
        const sd = generatedQuestions.scenario_dialogue;
        
        // 检查题目是否重复
        const isDuplicate = await isQuestionDuplicate(userid, chapter, level, sd.dialogue);
        if (!isDuplicate) {
          // 构建relatedWords，包含wordId
          const relatedWords = (sd.relatedWords || []).map(w => {
            const wordInfo = validWordList.find(vw => vw.word === w);
            return {
              wordId: wordInfo?.wordId || '',
              word: w,
              meaning: wordInfo?.meaning || ''
            };
          });

          // 验证和修正correctAnswer格式
          const validatedCorrectAnswer = validateAndFixCorrectAnswer(sd.correctAnswer, sd.options);
          
          // 如果correctAnswer格式不正确，记录警告
          if (validatedCorrectAnswer !== sd.correctAnswer) {
            logger.warn(`情景对话题correctAnswer格式已修正: 原值="${sd.correctAnswer}" -> 修正值="${validatedCorrectAnswer}"`);
          }

          const question = new Question({
            userId: userid,
            chapter: chapter,
            level: level,
            questionType: QUESTION_TYPES.SCENARIO,
            difficulty: DIFFICULTY_LEVELS.MEDIUM,
            question: sd.dialogue,
            questionHash: generateQuestionHash(sd.dialogue),
            options: sd.options,
            correctAnswer: validatedCorrectAnswer,
            explanation: sd.explanation,
          });
          
          if (relatedWords.length > 0) {
            question.relatedWords = relatedWords;
          }
          
          await question.save();
          savedQuestions.push(question);
          savedQuestionIds.push(question._id);
        } else {
          logger.warn(`跳过重复的情景对话题: ${sd.dialogue.substring(0, 50)}...`);
        }
      }

      // 保存听力理解题到数据库
      if (generatedQuestions.listening_comprehension && Array.isArray(generatedQuestions.listening_comprehension)) {
        for (const lc of generatedQuestions.listening_comprehension) {
          // 检查题目是否重复
          const isDuplicate = await isQuestionDuplicate(userid, chapter, level, lc.content);
          if (isDuplicate) {
            logger.warn(`跳过重复的听力理解题: ${lc.content.substring(0, 50)}...`);
            continue;
          }

          // 构建relatedWords，包含wordId
          const relatedWords = (lc.relatedWords || []).map(w => {
            const wordInfo = validWordList.find(vw => vw.word === w);
            return {
              wordId: wordInfo?.wordId || '',
              word: w,
              meaning: wordInfo?.meaning || ''
            };
          });

          for (const q of lc.questions) {
            // 验证和修正correctAnswer格式
            const validatedCorrectAnswer = validateAndFixCorrectAnswer(q.correctAnswer, q.options);
            
            // 如果correctAnswer格式不正确，记录警告
            if (validatedCorrectAnswer !== q.correctAnswer) {
              logger.warn(`听力理解题correctAnswer格式已修正: 原值="${q.correctAnswer}" -> 修正值="${validatedCorrectAnswer}"`);
            }

            const question = new Question({
              userId: userid,
              chapter: chapter,
              level: level,
              questionType: QUESTION_TYPES.LISTENING_COMPREHENSION,
              difficulty: DIFFICULTY_LEVELS.MEDIUM,
              question: lc.content,
              questionHash: generateQuestionHash(lc.content),
              options: q.options,
              correctAnswer: validatedCorrectAnswer,
              explanation: q.explanation,
            });
            
            if (relatedWords.length > 0) {
              question.relatedWords = relatedWords;
            }
            
            await question.save();
            savedQuestions.push(question);
            savedQuestionIds.push(question._id);
          }
        }
      }

      // 保存完形填空题到数据库
      if (generatedQuestions.cloze_test && Array.isArray(generatedQuestions.cloze_test)) {
        for (const ct of generatedQuestions.cloze_test) {
          // 检查题目是否重复
          const isDuplicate = await isQuestionDuplicate(userid, chapter, level, ct.content);
          if (isDuplicate) {
            logger.warn(`跳过重复的完形填空题: ${ct.content.substring(0, 50)}...`);
            continue;
          }

          // 构建relatedWords，包含wordId
          const relatedWords = (ct.relatedWords || []).map(w => {
            const wordInfo = validWordList.find(vw => vw.word === w);
            return {
              wordId: wordInfo?.wordId || '',
              word: w,
              meaning: wordInfo?.meaning || ''
            };
          });

          for (const blank of ct.blanks) {
            const question = new Question({
              userId: userid,
              chapter: chapter,
              level: level,
              questionType: QUESTION_TYPES.CLOZE_TEST,
              difficulty: DIFFICULTY_LEVELS.MEDIUM,
              question: ct.content,
              questionHash: generateQuestionHash(ct.content),
              options: blank.options.map((opt, idx) => ({
                key: String.fromCharCode(65 + idx),
                content: opt
              })),
              correctAnswer: blank.answer,
              explanation: blank.explanation,
            });
            
            if (relatedWords.length > 0) {
              question.relatedWords = relatedWords;
            }
            
            await question.save();
            savedQuestions.push(question);
            savedQuestionIds.push(question._id);
          }
        }
      }

      // 保存翻译题到数据库
      if (generatedQuestions.translation && Array.isArray(generatedQuestions.translation)) {
        for (const t of generatedQuestions.translation) {
          // 检查题目是否重复
          const isDuplicate = await isQuestionDuplicate(userid, chapter, level, t.english);
          if (isDuplicate) {
            logger.warn(`跳过重复的翻译题: ${t.english.substring(0, 50)}...`);
            continue;
          }

          // 构建relatedWords，包含wordId
          const relatedWords = (t.relatedWords || []).map(w => {
            const wordInfo = validWordList.find(vw => vw.word === w);
            return {
              wordId: wordInfo?.wordId || '',
              word: w,
              meaning: wordInfo?.meaning || ''
            };
          });

          const question = new Question({
            userId: userid,
            chapter: chapter,
            level: level,
            questionType: QUESTION_TYPES.TRANSLATION,
            difficulty: DIFFICULTY_LEVELS.MEDIUM,
            question: t.english,
            questionHash: generateQuestionHash(t.english),
            options: [{key: 'A', content: t.chinese}],
            correctAnswer: 'A',
            explanation: t.tips,
          });
          
          if (relatedWords.length > 0) {
            question.relatedWords = relatedWords;
          }
          
          await question.save();
          savedQuestions.push(question);
          savedQuestionIds.push(question._id);
        }
      }

      // 保存写作题到数据库
      if (generatedQuestions.writing && Array.isArray(generatedQuestions.writing)) {
        for (const w of generatedQuestions.writing) {
          // 检查题目是否重复
          const isDuplicate = await isQuestionDuplicate(userid, chapter, level, w.task);
          if (isDuplicate) {
            logger.warn(`跳过重复的写作题: ${w.task.substring(0, 50)}...`);
            continue;
          }

          // 构建relatedWords，包含wordId
          const relatedWords = (w.relatedWords || []).map(wrd => {
            const wordInfo = validWordList.find(vw => vw.word === wrd);
            return {
              wordId: wordInfo?.wordId || '',
              word: wrd,
              meaning: wordInfo?.meaning || ''
            };
          });

          const question = new Question({
            userId: userid,
            chapter: chapter,
            level: level,
            questionType: QUESTION_TYPES.WRITING,
            difficulty: DIFFICULTY_LEVELS.MEDIUM,
            question: w.task,
            questionHash: generateQuestionHash(w.task),
            options: [
              {key: 'A', content: w.requirements},
              {key: 'B', content: w.gradingCriteria},
              {key: 'C', content: w.sampleAnswer}
            ],
            correctAnswer: 'A',
            explanation: '写作任务',
          });
          
          if (relatedWords.length > 0) {
            question.relatedWords = relatedWords;
          }
          
          await question.save();
          savedQuestions.push(question);
          savedQuestionIds.push(question._id);
        }
      }

      // 保存判断题到数据库
      if (generatedQuestions.true_false && Array.isArray(generatedQuestions.true_false)) {
        for (const tf of generatedQuestions.true_false) {
          // 检查题目是否重复
          const isDuplicate = await isQuestionDuplicate(userid, chapter, level, tf.statement);
          if (isDuplicate) {
            logger.warn(`跳过重复的判断题: ${tf.statement.substring(0, 50)}...`);
            continue;
          }

          // 构建relatedWords，包含wordId
          const relatedWords = (tf.relatedWords || []).map(w => {
            const wordInfo = validWordList.find(vw => vw.word === w);
            return {
              wordId: wordInfo?.wordId || '',
              word: w,
              meaning: wordInfo?.meaning || ''
            };
          });

          const question = new Question({
            userId: userid,
            chapter: chapter,
            level: level,
            questionType: QUESTION_TYPES.TRUE_FALSE,
            difficulty: DIFFICULTY_LEVELS.MEDIUM,
            question: tf.statement,
            questionHash: generateQuestionHash(tf.statement),
            options: [
              {key: 'A', content: '正确'},
              {key: 'B', content: '错误'}
            ],
            correctAnswer: tf.correctAnswer.toLowerCase() === 'true' ? 'A' : 'B',
            explanation: tf.explanation,
          });

          if (relatedWords.length > 0) {
            question.relatedWords = relatedWords;
          }

          await question.save();
          savedQuestions.push(question);
          savedQuestionIds.push(question._id);
        }
      }

      logger.info(`成功保存 ${savedQuestions.length} 道题目到数据库`);

      res.json({
        code: 200,
        message: '题目生成成功',
        data: {
          count: savedQuestions.length,
          questions: savedQuestions.map(q => ({
            id: q._id,
            type: q.questionType,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            relatedWords: q.relatedWords
          }))
        }
      });
    } catch (error) {
      hasError = true;
      errorMessage = error.message;
      logger.error('保存题目时发生错误:', error);
      
      // 执行数据回滚：删除已保存的题目
      if (savedQuestionIds.length > 0) {
        try {
          await Question.deleteMany({ _id: { $in: savedQuestionIds } });
          logger.info(`已回滚 ${savedQuestionIds.length} 道题目`);
        } catch (rollbackError) {
          logger.error('数据回滚失败:', rollbackError);
        }
      }
      
      res.json({
        code: 500,
        message: '保存题目时发生错误，已回滚所有更改',
        error: errorMessage
      });
    }

  } catch (error) {
    logger.error('生成题目错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 获取用户的题目列表
router.get('/list', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { chapter, level, status } = req.query;

    // 构建查询条件
    const query = { userId: userid };
    if (chapter) query.chapter = chapter;
    if (level) query.level = parseInt(level);
    if (status) query.status = status;

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      code: 200,
      message: '获取成功',
      data: questions
    });

  } catch (error) {
    logger.error('获取题目列表错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 提交答案
router.post('/submit', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { questionId, answer, timeSpent } = req.body;

    if (!questionId || !answer) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 查找题目
    const question = await Question.findOne({
      _id: questionId,
      userId: userid
    });

    if (!question) {
      return res.json({
        code: 404,
        message: '题目不存在'
      });
    }

    // 判断答案是否正确
    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    // 更新题目状态
    question.userAnswer = answer;
    question.isCorrect = isCorrect;
    question.status = 'completed';
    if (timeSpent) question.timeSpent = timeSpent;

    await question.save();

    // 更新相关单词的优先级
    if (question.relatedWords && question.relatedWords.length > 0) {
      for (const relatedWord of question.relatedWords) {
        const userWord = await UserWord.findOne({
          userId: userid,
          wordId: relatedWord.wordId
        });

        if (userWord) {
          // 如果答对了，降低优先级；答错了，提高优先级
          userWord.priority = isCorrect 
            ? Math.max(0, userWord.priority - 5)
            : Math.min(100, userWord.priority + 10);
          await userWord.save();
        }
      }
    }

    res.json({
      code: 200,
      message: '提交成功',
      data: {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      }
    });

  } catch (error) {
    logger.error('提交答案错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
