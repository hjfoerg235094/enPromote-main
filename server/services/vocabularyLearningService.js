
const vocabularyService = require('./vocabularyService');
const User = require('../modules/User');
const UserWord = require('../modules/UserWord');
const Word = require('../modules/Word');
const { logger } = require('../utils/logger');

class VocabularyLearningService {
    /**
     * 获取用户当前学习进度
     * @param {string} userId - 用户ID
     * @returns {Object} 学习进度信息
     */
    async getUserLearningProgress(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 解析当前位置
            const position = user.cet4.position || 'A:0';
            const [chapter, index] = position.split(':');

            // 获取当前章节的单词总数
            const vocabulary = await vocabularyService.loadVocabulary('CET-4');
            const chapterWords = vocabulary[chapter] || [];
            const totalWords = chapterWords.length;

            // 获取用户已学习的单词数
            const userWords = await UserWord.countDocuments({ 
                userId: userId,
                status: { $in: ['know', 'learning'] }
            });

            // 获取今日学习单词数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayLearned = await UserWord.countDocuments({
                userId: userId,
                firstSeenAt: { $gte: today }
            });

            return {
                currentChapter: chapter,
                currentIndex: parseInt(index) || 0,
                chapterTotal: totalWords,
                chapterProgress: totalWords > 0 ? Math.round((parseInt(index) / totalWords) * 100) : 0,
                totalLearned: userWords,
                todayLearned: todayLearned,
                streakDays: user.cet4.streakDays || 0,
                lastStudyDate: user.cet4.lastStudyDate
            };
        } catch (error) {
            logger.error(`获取用户学习进度失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取学习单词列表
     * @param {string} userId - 用户ID
     * @param {string} chapter - 章节字母
     * @param {number} startIndex - 起始索引
     * @param {number} count - 单词数量
     * @returns {Object} 单词列表和相关信息
     */
    async getLearningWords(userId, chapter, startIndex, count = 20) {
        try {
            // 获取单词列表
            const result = await vocabularyService.getWordsByChapter('CET-4', chapter, startIndex, count);

            // 获取用户对这些单词的学习状态
            const wordTexts = result.words.map(w => typeof w === 'string' ? w : w.word);
            // 先从Word表中获取单词ID
            const Word = require('../modules/Word');
            const wordDocs = await Word.find({ word: { $in: wordTexts } });
            const wordIdMap = new Map(wordDocs.map(doc => [doc.word, doc._id.toString()]));
            const wordIds = wordTexts.map(text => wordIdMap.get(text));
            
            const userWords = await UserWord.find({
                userId: userId,
                wordId: { $in: wordIds }
            });

            // 创建单词到学习状态的映射
            const wordStatusMap = new Map();
            userWords.forEach(uw => {
                wordStatusMap.set(uw.wordId, {
                    status: uw.status,
                    reviewCounts: uw.reviewCounts,
                    nextReviewTime: uw.nextReviewTime
                });
            });

            // 为每个单词添加学习状态
            const wordsWithStatus = result.words.map(wordItem => {
                const wordText = typeof wordItem === 'string' ? wordItem : wordItem.word;
                const wordId = wordIdMap.get(wordText);
                const status = wordStatusMap.get(wordId);

                return {
                    ...wordItem,
                    learningStatus: status ? status.status : 'new',
                    reviewCounts: status ? status.reviewCounts : 0,
                    nextReviewTime: status ? status.nextReviewTime : null
                };
            });

            return {
                words: wordsWithStatus,
                total: result.total,
                currentIndex: startIndex,
                hasMore: result.hasMore,
                chapter: chapter
            };
        } catch (error) {
            logger.error(`获取学习单词列表失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 更新用户学习进度
     * @param {string} userId - 用户ID
     * @param {number} studiedWords - 本次学习的单词数
     * @param {string} chapter - 当前章节
     * @param {number} newIndex - 新的索引位置
     * @returns {Object} 更新后的进度信息
     */
    async updateLearningProgress(userId, studiedWords, chapter, newIndex) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 更新学习进度
            user.cet4.position = `${chapter}:${newIndex}`;
            user.cet4.lastStudyTime = new Date();
            user.totalWords = (user.totalWords || 0) + studiedWords;

            // 更新今日学习数量
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastStudyDate = new Date(user.cet4.lastStudyDate || new Date());
            lastStudyDate.setHours(0, 0, 0, 0);

            if (today.getTime() !== lastStudyDate.getTime()) {
                user.cet4.todayStudiedWords = studiedWords;

                // 计算连续学习天数
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastStudyDate.getTime() === yesterday.getTime()) {
                    user.cet4.streakDays = (user.cet4.streakDays || 0) + 1;
                } else {
                    user.cet4.streakDays = 1;
                }

                user.cet4.lastStudyDate = today;
            } else {
                user.cet4.todayStudiedWords = (user.cet4.todayStudiedWords || 0) + studiedWords;
            }

            // 添加学习历史记录
            user.studyHistory.push({
                date: new Date(),
                words: studiedWords
            });

            // 只保留最近30天的学习记录
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            user.studyHistory = user.studyHistory.filter(
                record => record.date >= thirtyDaysAgo
            );

            await user.save();

            logger.info(`用户学习进度更新: ${userId}, 学习${studiedWords}个单词, 新位置: ${chapter}:${newIndex}`);

            return {
                position: user.cet4.position,
                todayStudiedWords: user.cet4.todayStudiedWords,
                streakDays: user.cet4.streakDays,
                totalWords: user.totalWords
            };
        } catch (error) {
            logger.error(`更新学习进度失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 记录单词学习结果
     * @param {string} userId - 用户ID
     * @param {string} word - 单词
     * @param {string} status - 学习状态 (know, vague, unknown)
     * @returns {Object} 更新后的单词学习状态
     */
    async recordWordLearning(userId, word, status) {
        try {
            // 先从Word表中查找单词ID
            const wordDoc = await Word.findOne({ word });
            const wordId = wordDoc ? wordDoc._id.toString() : word;

            // 查找或创建用户单词记录
            let userWord = await UserWord.findOne({ userId, wordId });

            if (!userWord) {
                userWord = new UserWord({
                    userId,
                    wordId: wordId,
                    status: status,
                    reviewCounts: 1,
                    firstSeenAt: new Date(),
                    lastSeenAt: new Date(),
                    nextReviewTime: this.calculateNextReviewTime(status, 1)
                });
            } else {
                userWord.status = status;
                userWord.reviewCounts = (userWord.reviewCounts || 0) + 1;
                userWord.lastSeenAt = new Date();
                userWord.nextReviewTime = this.calculateNextReviewTime(status, userWord.reviewCounts);
            }

            await userWord.save();

            logger.info(`记录单词学习结果: ${userId}, ${word}, ${status}, 复习次数: ${userWord.reviewCounts}`);

            return userWord;
        } catch (error) {
            logger.error(`记录单词学习结果失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 计算下次复习时间
     * @param {string} status - 学习状态
     * @param {number} reviewCounts - 复习次数
     * @returns {Date} 下次复习时间
     */
    calculateNextReviewTime(status, reviewCounts) {
        const now = new Date();
        let interval = 24 * 60 * 60 * 1000; // 默认1天

        switch (status) {
            case 'know':
                // 认识的单词，间隔逐渐增大
                const intervals = [1, 3, 7, 14, 30]; // 天数
                const intervalIndex = Math.min(reviewCounts - 1, intervals.length - 1);
                interval = intervals[intervalIndex] * 24 * 60 * 60 * 1000;
                break;
            case 'vague':
                // 模糊的单词，1天后复习
                interval = 1 * 24 * 60 * 60 * 1000;
                break;
            case 'unknown':
                // 不认识的单词，1天后复习
                interval = 1 * 24 * 60 * 60 * 1000;
                break;
            default:
                // 新单词，30分钟后复习
                interval = 30 * 60 * 1000;
                break;
        }

        return new Date(now.getTime() + interval);
    }

    /**
     * 获取需要复习的单词
     * @param {string} userId - 用户ID
     * @param {number} limit - 返回数量限制
     * @returns {Array} 需要复习的单词列表
     */
    async getReviewWords(userId, limit = 20) {
        try {
            const now = new Date();
            const reviewWords = await UserWord.find({
                userId: userId,
                nextReviewTime: { $lte: now }
            })
            .sort({ nextReviewTime: 1 })
            .limit(limit);

            // 获取单词详细信息
            const wordTexts = reviewWords.map(rw => rw.word);
            const vocabulary = await vocabularyService.loadVocabulary('CET-4');

            // 为每个复习单词添加详细信息
            const wordsWithDetail = reviewWords.map(userWord => {
                // 从词汇库中查找单词详细信息
                let wordDetail = null;
                for (const chapter in vocabulary) {
                    const found = vocabulary[chapter].find(w => {
                        const wordText = typeof w === 'string' ? w : w.word;
                        return wordText === userWord.word;
                    });
                    if (found) {
                        wordDetail = typeof found === 'string' ? { word: found } : found;
                        break;
                    }
                }

                return {
                    ...userWord.toObject(),
                    detail: wordDetail
                };
            });

            return wordsWithDetail;
        } catch (error) {
            logger.error(`获取复习单词失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 切换到下一章节
     * @param {string} userId - 用户ID
     * @returns {Object} 新的章节信息
     */
    async moveToNextChapter(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('用户不存在');
            }

            // 获取当前章节
            const position = user.cet4.position || 'A:0';
            const [currentChapter] = position.split(':');

            // 章节列表
            const chapters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            const currentChapterIndex = chapters.indexOf(currentChapter);

            if (currentChapterIndex === -1 || currentChapterIndex >= chapters.length - 1) {
                // 已经是最后一个章节
                return {
                    currentChapter,
                    nextChapter: null,
                    isLastChapter: true
                };
            }

            // 切换到下一章节
            const nextChapter = chapters[currentChapterIndex + 1];
            user.cet4.position = `${nextChapter}:0`;
            user.currentChapter = nextChapter;
            await user.save();

            logger.info(`用户切换章节: ${userId}, ${currentChapter} -> ${nextChapter}`);

            return {
                currentChapter,
                nextChapter,
                isLastChapter: false,
                newPosition: user.cet4.position
            };
        } catch (error) {
            logger.error(`切换章节失败: ${error.message}`);
            throw error;
        }
    }
}

// 导出单例
module.exports = new VocabularyLearningService();
