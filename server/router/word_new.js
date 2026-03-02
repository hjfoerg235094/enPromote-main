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

module.exports = router;
