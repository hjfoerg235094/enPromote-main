const express = require('express');
const router = express.Router();
const UserWord = require('../modules/UserWord');
const Word = require('../modules/Word');
const { logger } = require('../utils/logger');

const MISSING_EXAMPLE_TEXT = '暂无例句';

function getWordExample(word) {
  const directExample = word.example;
  if (directExample && directExample.trim() && directExample.trim() !== MISSING_EXAMPLE_TEXT) {
    return directExample;
  }

  const nestedExample = word.meanings?.[0]?.definitions?.[0]?.example;
  if (nestedExample && nestedExample.trim() && nestedExample.trim() !== MISSING_EXAMPLE_TEXT) {
    return nestedExample;
  }

  return MISSING_EXAMPLE_TEXT;
}

// 获取用户收藏的单词列表
router.get('/list', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const favoriteWords = await UserWord.find({ 
      userId: userid, 
      isFavorite: true 
    }).sort({ lastSeenAt: -1 });

    // 获取单词详细信息
    const words = await Promise.all(favoriteWords.map(async (userWord) => {
      const word = await Word.findById(userWord.wordId);
      if (!word) return null;

      return {
        id: userWord._id,
        wordId: word._id,
        word: word.word,
        meaning: word.chineseMeaning || word.mean || word.definition,
        phonetic: word.phonetics && word.phonetics[0] ? word.phonetics[0].text : '',
        example: getWordExample(word),
        status: userWord.status,
        reviewCounts: userWord.reviewCounts,
        priority: userWord.priority,
        addedAt: userWord.lastSeenAt
      };
    }));

    const filteredWords = words.filter(word => word !== null);

    res.json({
      code: 200,
      message: '获取成功',
      data: filteredWords
    });
  } catch (error) {
    logger.error('获取收藏单词列表错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 添加单词到收藏
router.post('/add', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { wordId } = req.body;
    if (!wordId) {
      return res.json({
        code: 400,
        message: '缺少单词ID'
      });
    }

    // 检查单词是否存在
    const word = await Word.findById(wordId);
    if (!word) {
      return res.json({
        code: 404,
        message: '单词不存在'
      });
    }

    // 查找或创建用户单词记录
    let userWord = await UserWord.findOne({ userId: userid, wordId });

    if (userWord) {
      // 如果已存在，更新收藏状态
      if (userWord.isFavorite) {
        return res.json({
          code: 200,
          message: '单词已在收藏中'
        });
      }
      userWord.isFavorite = true;
      await userWord.save();
    } else {
      // 如果不存在，创建新记录
      userWord = new UserWord({
        userId: userid,
        wordId,
        isFavorite: true,
        status: 'unknown',
        reviewCounts: 0,
        priority: 50
      });
      await userWord.save();
    }

    logger.info(`用户 ${userid} 添加单词 ${word.word} 到收藏`);

    res.json({
      code: 200,
      message: '添加成功',
      data: {
        wordId,
        word: word.word,
        isFavorite: true
      }
    });
  } catch (error) {
    logger.error('添加收藏单词错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 取消收藏单词
router.post('/remove', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { wordId } = req.body;
    if (!wordId) {
      return res.json({
        code: 400,
        message: '缺少单词ID'
      });
    }

    // 查找用户单词记录
    const userWord = await UserWord.findOne({ userId: userid, wordId });

    if (!userWord) {
      return res.json({
        code: 404,
        message: '未找到该单词记录'
      });
    }

    // 更新收藏状态
    userWord.isFavorite = false;
    await userWord.save();

    // 获取单词信息用于日志
    const word = await Word.findById(wordId);
    logger.info(`用户 ${userid} 取消收藏单词 ${word ? word.word : wordId}`);

    res.json({
      code: 200,
      message: '取消收藏成功',
      data: {
        wordId,
        isFavorite: false
      }
    });
  } catch (error) {
    logger.error('取消收藏单词错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 检查单词是否已收藏
router.get('/check', async (req, res) => {
  try {
    const userid = req.session.userid;
    if (!userid) {
      return res.json({
        code: 401,
        message: '请先登录'
      });
    }

    const { wordId } = req.query;
    if (!wordId) {
      return res.json({
        code: 400,
        message: '缺少单词ID'
      });
    }

    const userWord = await UserWord.findOne({ userId: userid, wordId });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        isFavorite: userWord ? userWord.isFavorite : false
      }
    });
  } catch (error) {
    logger.error('检查单词收藏状态错误:', error);
    res.json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
