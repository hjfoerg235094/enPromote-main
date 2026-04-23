const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const User = require('../modules/User');
const Word = require('../modules/Word');
const UserWord = require('../modules/UserWord');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getWordFromApi } = require('./third_part/getword');
const { logger, logApiError, logUserAction, logDbError } = require('../utils/logger');
const { LEGAL_TLS_SOCKET_OPTIONS } = require('mongodb');
const http = require('http');
const { generateAndSaveMeaning, generateAndSaveExample } = require('../ai/aliyunExampleGenerator');

// 缓存词汇库数据
let vocabularyCache = null;
let vocabularyCacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 缓存1小时

/**
 * 从词汇库中获取单词释义
 * @param {string} word - 单词
 * @returns {string} 单词释义
 */
function getWordMeaningFromVocabulary(word) {
  try {
    // 如果缓存过期或不存在，重新加载词汇库
    if (!vocabularyCache || !vocabularyCacheTime || Date.now() - vocabularyCacheTime > CACHE_DURATION) {
      const vocabularyPath = path.join(__dirname, '..', 'word', 'CET-4.json');
      if (fs.existsSync(vocabularyPath)) {
        vocabularyCache = JSON.parse(fs.readFileSync(vocabularyPath, 'utf-8'));
        vocabularyCacheTime = Date.now();
        console.log('词汇库已加载到缓存');
      } else {
        console.error('词汇库文件不存在:', vocabularyPath);
        return '';
      }
    }

    // 遍历所有字母分组查找单词
    const letters = Object.keys(vocabularyCache);
    for (const letter of letters) {
      const words = vocabularyCache[letter];
      const foundWord = words.find(w => w.word.toLowerCase() === word.toLowerCase());
      if (foundWord && foundWord.mean) {
        return foundWord.mean;
      }
    }

    return '';
  } catch (error) {
    console.error('从词汇库获取词义失败:', error);
    return '';
  }
}

router.get('/getWordProgress', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        logUserAction(req, 'GET_WORD_PROGRESS', { userId: userid });

        res.json({
            code: 200,
            data: user.cet4.position
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取学习进度失败'
        });
    }
});


router.get('/getWordList', async (req, res) => {
    try {
        // 支持章节参数，优先使用章节参数
        const { chapter } = req.query; // 新增：章节参数 A, B, C...
        let letter = req.query.chapter;
        let index = req.query.index;

        console.log(`请求获取单词列表: 章节=${chapter}, 字母=${letter}, 索引=${index}`);
        console.log(`用户ID: ${req.session.userid}`);

        let vocabularyPath;
        let vocabulary;

        vocabularyPath = path.join(__dirname, '..', 'vocabulary', 'CET-4.json');
        console.log(vocabularyPath)
        if (!fs.existsSync(vocabularyPath)) {
            return res.json({
                code: 404,
                message: `章节 ${chapter} 的词汇表文件不存在`
            });
        }
        vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf-8'));
        // 章节文件直接包含单词数组，不需要字母索引
        const wordList = vocabulary[letter];


        // 确定返回的单词范围
        const user = await User.findOne({ _id: req.session.userid });
        // const planStudyWord = user?.planStudyWords || 30;
        const planStudyWord = 20;
        console.log(`planStudyWord=${planStudyWord}`);

        const startIdx = index ? parseInt(index) : 0;
        const endIdx = Math.min(startIdx + planStudyWord, wordList.length);

        // 更新用户学习进度，无论是章节模式还是字母模式
        if (startIdx >= wordList.length) {
            // 如果当前章节的单词已学完，切换到下一章节或重置
            if (chapter) {
                // 章节模式：尝试切换到下一章节
                const chapters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                const currentChapterIndex = chapters.indexOf(chapter);

                if (currentChapterIndex !== -1 && currentChapterIndex < chapters.length - 1) {
                    // 切换到下一章节
                    const nextChapter = chapters[currentChapterIndex + 1];
                    const userid = req.session.userid;
                    const user = await User.findById(userid);
                    user.cet4.position = `${nextChapter}:0`;
                    await user.save();
                    console.log(`章节${chapter}学习完成，切换到章节${nextChapter}`);
                }
            } else {
                // 字母模式：切换到下一个字母
                letter = String.fromCharCode(letter.charCodeAt(0) + 1);
                index = 0;
                const userid = req.session.userid;
                const user = await User.findById(userid);
                user.cet4.position = `${letter}:${index}`;
                await user.save();
            }
        }

        // 提取要返回的单词列表
        const wordsToReturn = await Promise.all(wordList.slice(startIdx, endIdx).map(async (wordItem) => {
            const wordText = typeof wordItem === 'string' ? wordItem : wordItem.word;
            // 从数据库中查找单词，获取_id
            const word = await Word.findOne({ word: wordText });
            if (word) {
                // 获取音标
                let phonetic = '';
                if (word.phonetics && word.phonetics.length > 0) {
                    phonetic = word.phonetics[0].text || '';
                }
                
                // 获取中文释义
                let mean = word.chineseMeaning || '';
                if (!mean && word.meanings && word.meanings.length > 0) {
                    const firstMeaning = word.meanings[0];
                    if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                        mean = firstMeaning.definitions[0].definition || '';
                    }
                }
                
                return {
                    _id: word._id,
                    word: word.word,
                    phonetic_symbol: phonetic,
                    mean: mean,
                    definition: mean,
                    example: word.meanings && word.meanings.length > 0 && word.meanings[0].definitions && word.meanings[0].definitions.length > 0 ? word.meanings[0].definitions[0].example : ''
                };
            }
            // 如果数据库中没有找到，返回原始数据
            return typeof wordItem === 'string' ? { word: wordItem } : wordItem;
        }));

        console.log(`返回单词列表 (章节=${chapter || '字母模式'}): ${wordsToReturn.length}个单词`);

        return res.json({
            code: 200,
            data: {
                words: wordsToReturn,
                wordListLen: wordsToReturn.length,
                total: wordList.length,
                currentIndex: startIdx,
                hasMore: endIdx < wordList.length,
                chapter: chapter || null, // 返回章节信息
                mode: chapter ? 'chapter' : 'letter' // 返回模式信息
            }
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: 500,
            message: '获取单词列表失败',
            error: error.message
        });
    }
});

router.post('/updateWordProgress', async (req, res) => {
    try {
        const studyWords = req.body.studyWords || 0;
        const userid = req.session.userid;

        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        // 解析当前位置
        const currentPosition = user.cet4.position || 'A:0';
        const parts = currentPosition.split(':');
        const letter = parts[0];
        let index = parseInt(parts[1]) || 0;

        // 增加学习单词数量
        index += studyWords;

        // 更新位置
        user.cet4.position = `${letter}:${index}`;
        user.totalWords += studyWords;
        // 更新学习统计
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastStudyDate = new Date(user.cet4.lastStudyDate || new Date());
        lastStudyDate.setHours(0, 0, 0, 0);

        // 如果是今天第一次学习，重置今日学习数量
        if (today.getTime() !== lastStudyDate.getTime()) {
            user.cet4.todayStudiedWords = studyWords;

            // 计算连续天数
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // 检查是否是第一次学习（lastStudyDate为默认值或很久以前）
            const isFirstTime = !user.cet4.lastStudyDate ||
                (today.getTime() - lastStudyDate.getTime()) > 7 * 24 * 60 * 60 * 1000; // 超过7天

            if (isFirstTime) {
                // 第一次学习或长时间未学习，重新开始
                user.cet4.streakDays = 1;
                console.log(`用户${userid}第一次学习或重新开始，连续天数重置为1`);
            } else if (lastStudyDate.getTime() === yesterday.getTime()) {
                // 连续学习（昨天学习了，今天继续）
                const oldStreak = user.cet4.streakDays || 0;
                user.cet4.streakDays = oldStreak + 1;
                console.log(`用户${userid}连续学习，连续天数从${oldStreak}增加到${user.cet4.streakDays}`);
            } else if (lastStudyDate.getTime() < yesterday.getTime()) {
                // 中断了（上次学习是前天或更早），重新开始
                const oldStreak = user.cet4.streakDays || 0;
                user.cet4.streakDays = 1;
                console.log(`用户${userid}学习中断，连续天数从${oldStreak}重置为1`);
            }
            // 如果 lastStudyDate > yesterday，说明时间有问题，保持原值
            user.cet4.lastStudyDate = today;
        } else {
            // 今天已经学习过，累加学习数量（连续天数不变）
            user.cet4.todayStudiedWords = (user.cet4.todayStudiedWords || 0) + studyWords;
        }

        user.cet4.lastStudyTime = new Date();

        await user.save();

        logUserAction(req, 'UPDATE_WORD_PROGRESS', {
            userId: userid,
            studyWords,
            newPosition: user.cet4.position,
            todayWords: user.cet4.todayStudiedWords,
            streakDays: user.cet4.streakDays
        });

        logger.info(`用户学习进度更新: ${userid}, 学习${studyWords}个单词`);

        res.json({
            code: 200,
            message: '更新成功'
        });
    } catch (error) {
        logApiError(req, error, 500);
        logDbError('UPDATE_WORD_PROGRESS', error, 'User');
        res.status(500).json({
            code: 500,
            message: '更新学习进度失败'
        });
    }
});

// 添加getWordInfo路由，直接使用getWordFromApi函数
router.get('/getWordInfo', async (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.json({ code: 400, message: '请输入单词' });
    }
    try {
        const data = await getWordFromApi(word);
        // 从数据库中查找单词，获取ID
        const wordDoc = await Word.findOne({ word: word });
        if (wordDoc) {
            data.wordId = wordDoc._id.toString();
        }
        res.send(data);
    } catch (err) {
        console.error('API错误:', err.message);
        res.json({
            code: 500,
            message: '获取单词信息失败',
            error: err.message,
            suggestion: '请检查网络连接或代理设置'
        });
    }
});

// 获取单词听力
router.get('/getWordAudio', async (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.json({ code: 400, message: '请输入单词' });
    }
    try {
        // 直接返回有道词典的音频URL，使用HTTPS协议
        const voiceType = 2; // 美式发音
        const youDaoUrl = `https://dict.youdao.com/dictvoice?audio=${word}&type=${voiceType}`;
        res.json({
            code: 200,
            data: youDaoUrl
        });
    } catch (err) {
        console.error('API错误:', err.message);
        res.status(500).json({
            code: 500,
            message: '获取单词信息失败',
            error: err.message,
            suggestion: '请检查网络连接或代理设置'
        });
    }
});

// 更新用户单词状态
async function updateUserWordStatus(userId, wordId, isCorrect, source = 'vocabulary') {
  try {
    // 查找用户是否已学习过该单词
    let userWord = await UserWord.findOne({
      userId: userId,
      wordId: wordId
    });

    if (!userWord) {
      // 首次学习该单词
      userWord = new UserWord({
        userId: userId,
        wordId: wordId,
        status: isCorrect ? "learning" : "new",
        reviewCounts: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        nextReviewTime: new Date(Date.now() + 30), // 30秒后复习
        priority: isCorrect ? 1 : 0,
        source: source // 记录单词来源
      });
      await userWord.save();
    } else {
      // 更新已存在的单词学习记录
      const now = new Date();
      let nextReviewInterval = 24 * 60 * 60 * 1000; // 默认24小时后
      
      // 更新复习次数
      userWord.reviewCounts = (userWord.reviewCounts || 0) + 1;
      userWord.lastSeenAt = now;
      
      // 根据答题情况调整状态和复习间隔
      if (isCorrect) {
        // 答对，增加优先级
        userWord.priority = Math.min((userWord.priority || 0) + 1, 5);
        userWord.status = "learning";
        
        // 根据掌握度调整复习间隔
        if (userWord.priority === 1) nextReviewInterval = 24 * 60 * 60 * 1000; // 1天
        else if (userWord.priority === 2) nextReviewInterval = 3 * 24 * 60 * 60 * 1000; // 3天
        else if (userWord.priority === 3) nextReviewInterval = 7 * 24 * 60 * 60 * 1000; // 1周
        else if (userWord.priority === 4) nextReviewInterval = 14 * 24 * 60 * 60 * 1000; // 2周
        else if (userWord.priority === 5) nextReviewInterval = 30 * 24 * 60 * 60 * 1000; // 1个月
      } else {
        // 答错，降低优先级
        userWord.priority = Math.max((userWord.priority || 0) - 1, 0);
        userWord.status = "difficult";
        // 答错后第二天复习
        nextReviewInterval = 24 * 60 * 60 * 1000;
      }

      userWord.nextReviewTime = new Date(now.getTime() + nextReviewInterval);
      await userWord.save();
    }

    return userWord;
  } catch (error) {
    console.error('更新用户单词状态失败:', error);
    throw error;
  }
}

// 获取需要复习的单词
router.get('/getReviewWords', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    // 获取今天需要复习的单词（nextReviewTime <= 当前时间）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 查询需要复习的单词
    const reviewWords = await UserWord.find({
      userId: userid,
      nextReviewTime: {
        $lte: tomorrow
      }
    })
    .sort({ nextReviewTime: 1 })
    .limit(20); // 限制每次复习的单词数量

    // 获取单词详细信息
    const wordIds = reviewWords.map(item => item.wordId);
    const words = await Word.find({ _id: { $in: wordIds } });
    
    // 创建单词ID到单词对象的映射
    const wordMap = {};
    words.forEach(word => {
      wordMap[word._id.toString()] = word;
    });
    
    // 格式化返回数据
    const formattedWords = await Promise.all(reviewWords.map(async (item) => {
      const word = wordMap[item.wordId];

      // 获取释义 - 优先从词汇库获取
      let meaning = word ? word.chineseMeaning : '';

      // 如果数据库中没有词义，尝试从词汇库获取
      if (!meaning && word && word.word) {
        meaning = getWordMeaningFromVocabulary(word.word);
        console.log(`从词汇库获取词义: ${word.word} -> ${meaning}`);

        // 如果从词汇库获取到词义，保存到数据库
        if (meaning) {
          word.chineseMeaning = meaning;
          try {
            await word.save();
            console.log(`词义已保存到数据库: ${word.word}`);
          } catch (error) {
            console.error(`保存词义到数据库失败:`, error);
          }
        }
      }
      if (word && !meaning && word.meanings && word.meanings.length > 0) {
        const firstMeaning = word.meanings[0];
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          meaning = firstMeaning.definitions[0].definition || '';
        }
      }
      
      // 如果没有词义，使用AI生成并保存
      if (!meaning && word) {
        try {
          meaning = await generateAndSaveMeaning(item.wordId);
        } catch (error) {
          console.error(`生成词义失败:`, error);
        }
      }

      // 获取例句
      let example = '';
      console.log(`检查单词 ${word ? word.word : item.wordId} 的例句...`);
      console.log(`word对象:`, word ? {
        word: word.word,
        hasMeanings: !!word.meanings,
        meaningsLength: word.meanings ? word.meanings.length : 0
      } : null);

      if (word && word.meanings && word.meanings.length > 0) {
        const firstMeaning = word.meanings[0];
        console.log(`第一个词义:`, {
          hasDefinitions: !!firstMeaning.definitions,
          definitionsLength: firstMeaning.definitions ? firstMeaning.definitions.length : 0
        });

        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          example = firstMeaning.definitions[0].example || '';
          console.log(`从数据库获取的例句: "${example}"`);
        }
      }
      
      // 如果没有例句，使用AI生成并保存
      if (!example && word) {
        try {
          console.log(`为单词 ${word.word} (ID: ${item.wordId}) 生成例句...`);
          example = await generateAndSaveExample(item.wordId);
          console.log(`例句生成结果: ${example ? '成功' : '失败'}, 内容: ${example}`);
        } catch (error) {
          console.error(`生成例句失败:`, error);
        }
      } else {
        console.log(`单词 ${word ? word.word : item.wordId} 已有例句或word为空，跳过生成`);
      }

      return {
        id: item._id,
        wordId: item.wordId,
        word: word ? word.word : item.wordId,
        meaning: meaning,
        mean: meaning, // 添加mean字段，与词汇库字段名一致
        definition: meaning, // 同时提供definition字段，兼容前端
        example: example,
        priority: item.priority,
        status: item.status,
        reviewCounts: item.reviewCounts,
        lastSeenAt: item.lastSeenAt,
        nextReviewTime: item.nextReviewTime
      };
    }));

    logUserAction(req, 'GET_REVIEW_WORDS', { userId: userid, count: formattedWords.length });

    // 记录返回给前端的数据
    console.log('返回给前端的复习单词数据:', formattedWords.map(w => ({
      word: w.word,
      meaning: w.meaning,
      example: w.example
    })));

    res.json({
      code: 200,
      data: {
        words: formattedWords,
        count: formattedWords.length
      }
    });
  } catch (error) {
    logApiError(req, error, 500);
    res.status(500).json({
      code: 500,
      message: '获取复习单词失败',
      error: error.message
    });
  }
});

// 提交单词复习结果
router.post('/submitReview', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { wordId, isCorrect, word, newStatus, source } = req.body;
    if (!wordId || typeof isCorrect !== 'boolean') {
      return res.json({
        code: 400,
        message: '参数不完整'
      });
    }

    // 如果是直接传入单词字符串而不是wordId，需要先查找Word模型获取ID
    let actualWordId = wordId;
    if (typeof wordId === 'string' && !wordId.match(/^[0-9a-fA-F]{24}$/)) {
      const wordDoc = await Word.findOne({ word: wordId });
      if (wordDoc) {
        actualWordId = wordDoc._id.toString();
      } else {
        // 如果找不到单词，创建一个新记录
        const newWord = new Word({
          word: wordId,
          chineseMeaning: ''
        });
        await newWord.save();
        actualWordId = newWord._id.toString();
      }
    }

    // 确定状态
    let status = newStatus;
    if (!status) {
      if (isCorrect) {
        status = 'know';
      } else {
        status = 'unknown';
      }
    }

    // 更新单词状态
    await updateUserWordStatus(userid, actualWordId, isCorrect, source || 'vocabulary');

    logUserAction(req, 'SUBMIT_REVIEW', { 
      userId: userid, 
      wordId,
      isCorrect 
    });

    res.json({
      code: 200,
      message: '提交成功'
    });
  } catch (error) {
    logApiError(req, error, 500);
    res.status(500).json({
      code: 500,
      message: '提交复习结果失败',
      error: error.message
    });
  }
});

// 生成单词例句
router.post('/generateExample', async (req, res) => {
  try {
    const { wordId } = req.body;
    if (!wordId) {
      return res.json({
        code: 400,
        message: '请提供单词ID'
      });
    }

    // 查找单词
    const word = await Word.findById(wordId);
    if (!word) {
      return res.json({
        code: 404,
        message: '单词不存在'
      });
    }

    // 检查是否已有例句
    let example = '';
    if (word.meanings && word.meanings.length > 0 && 
        word.meanings[0].definitions && word.meanings[0].definitions.length > 0) {
      example = word.meanings[0].definitions[0].example || '';
    }

    // 如果没有例句，使用AI生成并保存
    if (!example) {
      try {
        example = await generateAndSaveExample(wordId);
      } catch (error) {
        console.error('生成例句失败:', error);
        return res.json({
          code: 500,
          message: '生成例句失败',
          error: error.message
        });
      }
    }

    res.json({
      code: 200,
      data: {
        wordId: wordId,
        word: word.word,
        example: example
      }
    });
  } catch (error) {
    logApiError(req, error, 500);
    res.status(500).json({
      code: 500,
      message: '生成例句失败',
      error: error.message
    });
  }
});

module.exports = router;