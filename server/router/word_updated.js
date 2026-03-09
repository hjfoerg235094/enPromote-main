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
const { updateWordReviewStatus } = require('../utils/spacedRepetition');
const StudyRecordService = require('../modules/StudyRecordService');

// 更新用户单词状态
async function updateUserWordStatus(userId, wordId, status, isCorrect) {
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
        status: status || (isCorrect ? "learning" : "new"),
        reviewCounts: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        nextReviewTime: new Date(Date.now() + 30), // 30秒后复习
        priority: isCorrect ? 1 : 0
      });
      await userWord.save();
    } else {
      // 使用遗忘算法更新单词状态
      const updatedData = updateWordReviewStatus(userWord.toObject(), status);

      // 更新数据库中的记录
      await UserWord.updateOne(
        { _id: userWord._id },
        { 
          $set: {
            status: updatedData.status,
            reviewCounts: updatedData.reviewCounts,
            lastSeenAt: updatedData.lastSeenAt,
            nextReviewTime: updatedData.nextReviewTime,
            priority: updatedData.priority
          }
        }
      );

      // 获取更新后的记录
      userWord = await UserWord.findById(userWord._id);
    }

    return userWord;
  } catch (error) {
    console.error('更新用户单词状态失败:', error);
    throw error;
  }
}

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

    const { wordId, isCorrect, word, newStatus } = req.body;
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
    await updateUserWordStatus(userid, actualWordId, status, isCorrect);

    logUserAction(req, 'SUBMIT_REVIEW', {
      userId: userid,
      wordId: actualWordId,
      word,
      isCorrect,
      status
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
    const formattedWords = reviewWords.map(item => {
      const word = wordMap[item.wordId];
      // 获取音标信息
      let phonetic_symbol = '';
      if (word && word.phonetics && word.phonetics.length > 0) {
        phonetic_symbol = word.phonetics[0].text || '';
      }
      
      // 获取例句信息
      let example = '暂无例句';
      if (word && word.meanings && word.meanings.length > 0 && 
          word.meanings[0].definitions && word.meanings[0].definitions.length > 0) {
        example = word.meanings[0].definitions[0].example || '暂无例句';
      }
      
      return {
        id: item._id,
        wordId: item.wordId,
        word: word ? word.word : item.wordId,
        meaning: word ? (word.chineseMeaning || 
          (word.meanings && word.meanings.length > 0 && 
           word.meanings[0].definitions && word.meanings[0].definitions.length > 0 ?
           word.meanings[0].definitions[0].definition : '')) : '',
        phonetic_symbol: phonetic_symbol,
        example: example,
        priority: item.priority,
        status: item.status,
        reviewCounts: item.reviewCounts,
        lastSeenAt: item.lastSeenAt,
        nextReviewTime: item.nextReviewTime
      };
    });

    logUserAction(req, 'GET_REVIEW_WORDS', { userId: userid, count: formattedWords.length });

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

// 获取单词进度
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

// 获取单词列表
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

        // 提取要返回的单词列表，并添加数据库中的ID
        const wordsToReturn = await Promise.all(
            wordList.slice(startIdx, endIdx).map(async (wordItem) => {
                const wordText = typeof wordItem === 'string' ? wordItem : wordItem.word;
                // 从数据库中查找单词，获取ID
                let wordDoc = await Word.findOne({ word: wordText });
                if (!wordDoc) {
                    // 如果数据库中没有找到，创建一个新单词记录
                    wordDoc = new Word({
                        word: wordText,
                        chapter: letter,
                        scenario: 'vocabulary'
                    });
                    await wordDoc.save();
                    console.log(`创建新单词记录: ${wordText}`);
                }
                return {
                    word: wordText,
                    _id: wordDoc._id.toString(),
                    ...(typeof wordItem === 'object' ? wordItem : {})
                };
            })
        );

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

// 更新单词进度
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

        // 更新用户学习进度
        const user = await User.findById(userid);
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        // 更新今日学习单词数
        if (studyWords > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 检查今天是否已经有学习记录
            const todayStr = today.toISOString().split('T')[0];
            let foundToday = false;
            
            for (let i = 0; i < user.studyHistory.length; i++) {
                const recordDate = new Date(user.studyHistory[i].date);
                const recordDateStr = recordDate.toISOString().split('T')[0];
                
                if (recordDateStr === todayStr) {
                    user.studyHistory[i].words += studyWords;
                    foundToday = true;
                    break;
                }
            }
            
            // 如果今天没有记录，添加新记录
            if (!foundToday) {
                user.studyHistory.push({
                    date: today,
                    words: studyWords
                });
            }
            
            // 更新连续学习天数
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            let hasYesterdayRecord = false;
            for (let i = 0; i < user.studyHistory.length; i++) {
                const recordDate = new Date(user.studyHistory[i].date);
                const recordDateStr = recordDate.toISOString().split('T')[0];
                
                if (recordDateStr === yesterdayStr) {
                    hasYesterdayRecord = true;
                    break;
                }
            }
            
            // 如果昨天有记录，连续天数+1
            if (hasYesterdayRecord) {
                user.streakDays = (user.streakDays || 0) + 1;
            } else {
                // 否则重置为1
                user.streakDays = 1;
            }
            
            // 更新总学习单词数
            user.totalWords = (user.totalWords || 0) + studyWords;
        }

        await user.save();

        // 记录学习活动到StudyRecord
        try {
            await StudyRecordService.recordStudyActivity(userid, 'vocabulary', {
                studyTime: Math.ceil(studyWords / 2), // 估算学习时间：每2个单词1分钟
                newWords: studyWords,
                reviewWords: 0,
                wordsCount: studyWords,
                accuracy: 0, // 词汇学习不计算准确率
                startTime: new Date(Date.now() - Math.ceil(studyWords / 2) * 60 * 1000), // 估算开始时间
                endTime: new Date()
            });
        } catch (recordError) {
            logger.error('记录学习活动失败:', recordError);
            // 不影响主流程，继续返回成功
        }

        logUserAction(req, 'UPDATE_WORD_PROGRESS', { 
            userId: userid, 
            studyWords 
        });

        res.json({
            code: 200,
            message: '更新学习进度成功',
            data: {
                todayWords: studyWords,
                totalWords: user.totalWords,
                streakDays: user.streakDays
            }
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '更新学习进度失败',
            error: error.message
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
        // 直接返回有道词典的音频URL
        const voiceType = 2; // 美式发音
        const youDaoUrl = `http://dict.youdao.com/dictvoice?audio=${word}&type=${voiceType}`;
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

module.exports = router;
