// 处理单词推流的api
const express = require('express');
const router = express.Router();
const UserWord = require('../modules/UserWord');
const User = require('../modules/User');
const Words = require('../modules/Word')
const { getWordFromApi } = require('./third_part/getword');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
// 返回复习单词列表api
router.get('/getReviewWord', async (req, res) => {
    const userid = req.session.userid;
    if (!userid) {
        return res.json({
            code: 401,
            message: '请先登录'
        });
    }
    const user = await User.findById(userid);
    const curSence =  req.query.chapter || user.currentChapter || 'A'; // 支持章节参数;
     
    console.log(curSence);
    //找出当前用户的单词
    const userWords = await UserWord
        .find({ userId: userid })
        .sort({ priority: -1 })
        .limit(30) // 限制最多返回30个单词

    const wordDate = await Promise.all(userWords.map(async data => {
        // 使用 findById 或 findOne 而不是 find，因为 find 返回数组
        const wordObj = await Words.findById(data['wordId']);

        if (!wordObj) {
            console.log(`/getReviewWord:未找到单词ID: ${data['wordId']}`);
            return null; // 或者返回默认值
        }
        // console.log('找到单词:', wordObj.word);

        // 获取释义
        let meaning = wordObj.chineseMeaning || '';
        if (!meaning && wordObj.meanings && wordObj.meanings.length > 0) {
            const firstMeaning = wordObj.meanings[0];
            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                meaning = firstMeaning.definitions[0].definition || '';
            }
        }

        // 获取例句
        let example = '';
        if (wordObj.meanings && wordObj.meanings.length > 0) {
            const firstMeaning = wordObj.meanings[0];
            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                example = firstMeaning.definitions[0].example || '';
            }
        }

        // 返回包含单词、中文释义和例句的对象
        return {
            word: wordObj.word,
            mean: meaning,
            meaning: meaning, // 同时提供meaning字段，兼容前端
            example: example,
            phonetic_symbol: wordObj.phonetics && wordObj.phonetics[0] ? wordObj.phonetics[0].text : '',
            initial: wordObj.word.charAt(0).toUpperCase()
        };
    })
    );
    res.json({
        code: 200,
        data: {
            words: wordDate.filter(item => item !== null),
            wordListLen: wordDate.filter(item => item !== null).length,
        }
    });
})

// 更新单词优先度api
router.post('/updateWordPriority', async (req, res) => {
    try {

        // 先获取userid和通过Word获取wordid
        const { word, newStatus } = req.body;
        const userId = req.session.userid
        const user = await User.findOne({ _id: userId });
        const chapter = user?.currentChapter;
        console.log(`chapter:${chapter}`);
        console.log(word);
        let wordObj = await Words.findOne({ word })
        if (!userId) {
            return res.code(400).json({
                code: 400,
                message: '无用户数据'
            })
        }
        if (!wordObj) {
            console.log(`${word}目前还没有,请稍等正在更新数据库`);
            await getWordFromApi(word)
            wordObj = await Words.findOne({ word })
        }
        let wordId = wordObj._id
        console.log(wordId.toString(), userId);

        if (!wordId) {
            return res.json({
                code: 400,
                message: '未知的单词id'
            })
        }
        // 利用wordid和userid进行查找
        let userWord = await UserWord.findOne({ userId, wordId: wordId.toString() });
        // 如果不存在，则为第一次，或某id错误（不会前面已经验证过了） 第一次进行入库
        if (!userWord) {
            userWord = new UserWord({
                userId,
                wordId,
                status: newStatus ? newStatus : 'unknown',
                sence: chapter,
                lastSeenAt: new Date() // 直接在创建时设置lastSeenAt
            })
            userWord.priority = await computedWordPriority(userWord);
            await userWord.save();
        } else {
            userWord.status = newStatus ? newStatus : userWord.status;// 因为听力不会传status，但需要更新状态（reviewCounts）
            userWord.priority = await computedWordPriority(userWord);
            userWord.lastSeenAt = new Date() // 更新最后复习时间
            await userWord.save();
        }

        userWord.reviewCounts++
        await userWord.save();
        res.json({
            code: 200,
            message: '更新成功'
        });
    } catch (error) {
        console.log(error);

        res.json({
            code: 500,
            message: '更新失败'
        });
    }
})

// 计算单词优先度
async function computedWordPriority(wordData) {
    try {
        const now = new Date();
        const {
            status,
            reviewCounts,
            firstSeenAt,
            lastSeenAt,
            nextReviewTime
        } = wordData;
        // 分项打分（满分100）
        let score = 0;

        // 1. status 权重
        switch (status) {
            case 'new': score += 30; break;
            case 'learning': score += 20; break;
            case 'know': score += 5; break;
            default: score += 10; break;
        }

        // 2. 距离上次复习时间越久，越加分
        const lastSeen = new Date(lastSeenAt);
        const hoursSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60); // 小时
        score += Math.min(hoursSinceLastSeen * 0.5, 20); // 最多加20分

        // 3. reviewCounts 越多，分数越低
        score += Math.max(15 - reviewCounts, 0); // 初期次数低得分高，最多15分

        // 4. nextReviewTime 是否已过
        const nextReview = new Date(nextReviewTime);
        const overdueHours = (now - nextReview) / (1000 * 60 * 60);
        if (overdueHours > 0) {
            score += Math.min(overdueHours * 1.5, 30); // 最多加30分
        }

        // 总分上限控制
        return Math.min(Math.round(score), 100);

    } catch (err) {
        console.log(err);
        return []
    }
}

module.exports = router;