
const mongoose = require('mongoose');
const Word = require('../modules/Word');
const UserWord = require('../modules/UserWord');
const { logger } = require('../utils/logger');

class VocabularyDbOptimizer {
    constructor() {
        this.dbConnection = null;
    }

    /**
     * 连接数据库
     */
    async connect() {
        try {
            const db = require('../config/db');
            await new Promise((resolve, reject) => {
                db((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            this.dbConnection = mongoose.connection;
            logger.info('数据库连接成功');
        } catch (error) {
            logger.error(`数据库连接失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 创建Word模型索引
     */
    async createWordIndexes() {
        try {
            logger.info('开始创建Word模型索引...');

            // 创建单词文本索引
            await Word.collection.createIndex({ word: 1 }, { unique: true });
            logger.info('创建单词文本索引成功');

            // 创建章节索引
            await Word.collection.createIndex({ chapter: 1 });
            logger.info('创建章节索引成功');

            // 创建场景索引
            await Word.collection.createIndex({ scenario: 1 });
            logger.info('创建场景索引成功');

            // 创建等级索引
            await Word.collection.createIndex({ level: 1 });
            logger.info('创建等级索引成功');

            // 创建复合索引（章节+场景）
            await Word.collection.createIndex({ chapter: 1, scenario: 1 });
            logger.info('创建复合索引（章节+场景）成功');

            logger.info('Word模型索引创建完成');
        } catch (error) {
            if (error.code !== 85) { // 忽略索引已存在的错误
                logger.error(`创建Word模型索引失败: ${error.message}`);
                throw error;
            }
        }
    }

    /**
     * 创建UserWord模型索引
     */
    async createUserWordIndexes() {
        try {
            logger.info('开始创建UserWord模型索引...');

            // 创建用户ID和单词ID的复合索引（已存在，但确保唯一性）
            await UserWord.collection.createIndex({ userId: 1, wordId: 1 }, { unique: true });
            logger.info('创建用户ID和单词ID复合索引成功');

            // 创建用户ID索引
            await UserWord.collection.createIndex({ userId: 1 });
            logger.info('创建用户ID索引成功');

            // 创建单词ID索引
            await UserWord.collection.createIndex({ wordId: 1 });
            logger.info('创建单词ID索引成功');

            // 创建状态索引
            await UserWord.collection.createIndex({ status: 1 });
            logger.info('创建状态索引成功');

            // 创建优先级索引
            await UserWord.collection.createIndex({ priority: -1 });
            logger.info('创建优先级索引成功');

            // 创建下次复习时间索引
            await UserWord.collection.createIndex({ nextReviewTime: 1 });
            logger.info('创建下次复习时间索引成功');

            // 创建复合索引（用户ID+下次复习时间）
            await UserWord.collection.createIndex({ userId: 1, nextReviewTime: 1 });
            logger.info('创建复合索引（用户ID+下次复习时间）成功');

            logger.info('UserWord模型索引创建完成');
        } catch (error) {
            if (error.code !== 85) { // 忽略索引已存在的错误
                logger.error(`创建UserWord模型索引失败: ${error.message}`);
                throw error;
            }
        }
    }

    /**
     * 优化Word模型数据
     */
    async optimizeWordData() {
        try {
            logger.info('开始优化Word模型数据...');

            // 查找没有音标的单词
            const wordsWithoutPhonetic = await Word.find({ 
                $or: [
                    { phonetics: { $exists: false } },
                    { phonetics: { $size: 0 } }
                ]
            });

            logger.info(`找到 ${wordsWithoutPhonetic.length} 个没有音标的单词`);

            // 查找没有释义的单词
            const wordsWithoutMeaning = await Word.find({
                $or: [
                    { chineseMeaning: { $exists: false } },
                    { chineseMeaning: '' },
                    { meanings: { $exists: false } },
                    { meanings: { $size: 0 } }
                ]
            });

            logger.info(`找到 ${wordsWithoutMeaning.length} 个没有释义的单词`);

            // 查找重复的单词
            const duplicateWords = await Word.aggregate([
                { $group: { _id: '$word', count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } }
            ]);

            logger.info(`找到 ${duplicateWords.length} 组重复的单词`);

            // 处理重复单词
            for (const duplicate of duplicateWords) {
                const words = await Word.find({ word: duplicate._id }).sort({ createdAt: 1 });

                // 保留最早的记录，删除其他记录
                for (let i = 1; i < words.length; i++) {
                    // 更新引用该单词的UserWord记录
                    await UserWord.updateMany(
                        { wordId: words[i]._id },
                        { wordId: words[0]._id }
                    );

                    // 删除重复的单词记录
                    await Word.deleteOne({ _id: words[i]._id });
                }

                logger.info(`处理重复单词: ${duplicate._id}, 保留最早的记录，删除 ${words.length - 1} 条重复记录`);
            }

            logger.info('Word模型数据优化完成');
        } catch (error) {
            logger.error(`优化Word模型数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 优化UserWord模型数据
     */
    async optimizeUserWordData() {
        try {
            logger.info('开始优化UserWord模型数据...');

            // 查找没有关联单词的UserWord记录
            const userWordsWithoutWord = await UserWord.find({
                wordId: { $exists: true }
            });

            const invalidUserWords = [];
            for (const userWord of userWordsWithoutWord) {
                const word = await Word.findById(userWord.wordId);
                if (!word) {
                    invalidUserWords.push(userWord._id);
                }
            }

            logger.info(`找到 ${invalidUserWords.length} 条没有关联单词的UserWord记录`);

            // 删除无效的UserWord记录
            if (invalidUserWords.length > 0) {
                await UserWord.deleteMany({ _id: { $in: invalidUserWords } });
                logger.info(`删除 ${invalidUserWords.length} 条无效的UserWord记录`);
            }

            // 查找过期的复习记录（超过1年未复习）
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const expiredReviewWords = await UserWord.find({
                nextReviewTime: { $lt: oneYearAgo }
            });

            logger.info(`找到 ${expiredReviewWords.length} 条过期的复习记录`);

            // 重置过期复习记录的状态
            if (expiredReviewWords.length > 0) {
                await UserWord.updateMany(
                    { nextReviewTime: { $lt: oneYearAgo } },
                    { 
                        status: 'new',
                        nextReviewTime: new Date(),
                        priority: 0
                    }
                );
                logger.info(`重置 ${expiredReviewWords.length} 条过期复习记录的状态`);
            }

            logger.info('UserWord模型数据优化完成');
        } catch (error) {
            logger.error(`优化UserWord模型数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 执行所有优化操作
     */
    async optimizeAll() {
        try {
            await this.connect();
            await this.createWordIndexes();
            await this.createUserWordIndexes();
            await this.optimizeWordData();
            await this.optimizeUserWordData();
            logger.info('所有数据库优化操作完成');
        } catch (error) {
            logger.error(`数据库优化失败: ${error.message}`);
            throw error;
        } finally {
            if (this.dbConnection) {
                await this.dbConnection.close();
                logger.info('数据库连接已关闭');
            }
        }
    }
}

// 如果直接运行此脚本，则执行所有优化操作
if (require.main === module) {
    const optimizer = new VocabularyDbOptimizer();
    optimizer.optimizeAll()
        .then(() => {
            console.log('数据库优化完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('数据库优化失败:', error);
            process.exit(1);
        });
}

module.exports = VocabularyDbOptimizer;
