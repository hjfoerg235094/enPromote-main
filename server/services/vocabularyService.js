
const fs = require('fs');
const path = require('path');
const Word = require('../modules/Word');
const UserWord = require('../modules/UserWord');
const { logger } = require('../utils/logger');

class VocabularyService {
    constructor() {
        this.vocabularyCache = new Map(); // 词汇缓存
        this.cacheExpiry = new Map(); // 缓存过期时间
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 缓存24小时
        this.vocabularyDir = path.join(__dirname, '..', 'word');
    }

    /**
     * 获取词汇文件路径
     * @param {string} level - 词汇等级 (CET-4, CET-6, PEE等)
     * @returns {string} 词汇文件路径
     */
    getVocabularyPath(level) {
        return path.join(this.vocabularyDir, `${level}.json`);
    }

    /**
     * 加载词汇数据（带缓存）
     * @param {string} level - 词汇等级
     * @returns {Object} 词汇数据
     */
    async loadVocabulary(level = 'CET-4') {
        try {
            // 检查缓存
            const cacheKey = level;
            if (this.vocabularyCache.has(cacheKey)) {
                const expiryTime = this.cacheExpiry.get(cacheKey);
                if (new Date() < expiryTime) {
                    logger.info(`使用缓存的词汇数据: ${level}`);
                    return this.vocabularyCache.get(cacheKey);
                }
            }

            // 加载文件
            const filePath = this.getVocabularyPath(level);
            if (!fs.existsSync(filePath)) {
                throw new Error(`词汇文件不存在: ${filePath}`);
            }

            const data = fs.readFileSync(filePath, 'utf-8');
            const vocabulary = JSON.parse(data);

            // 更新缓存
            this.vocabularyCache.set(cacheKey, vocabulary);
            this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_DURATION));

            logger.info(`加载词汇数据成功: ${level}`);
            return vocabulary;
        } catch (error) {
            logger.error(`加载词汇数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取指定章节的单词列表
     * @param {string} level - 词汇等级
     * @param {string} chapter - 章节字母 (A-Z)
     * @param {number} start - 起始索引
     * @param {number} limit - 返回数量限制
     * @returns {Array} 单词列表
     */
    async getWordsByChapter(level, chapter, start = 0, limit = 20) {
        try {
            const vocabulary = await this.loadVocabulary(level);
            const words = vocabulary[chapter] || [];

            return {
                words: words.slice(start, start + limit),
                total: words.length,
                hasMore: start + limit < words.length,
                currentIndex: start
            };
        } catch (error) {
            logger.error(`获取章节单词失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取单词详细信息
     * @param {string} word - 单词文本
     * @returns {Object} 单词详细信息
     */
    async getWordDetail(word) {
        try {
            // 首先从数据库查找
            let wordDoc = await Word.findOne({ word });

            if (!wordDoc) {
                // 如果数据库中没有，尝试从词汇文件中查找
                const vocabulary = await this.loadVocabulary('CET-4');
                for (const chapter in vocabulary) {
                    const found = vocabulary[chapter].find(w => 
                        typeof w === 'string' ? w === word : w.word === word
                    );
                    if (found) {
                        // 将找到的单词信息保存到数据库
                        const wordData = typeof found === 'string' 
                            ? { word: found }
                            : {
                                word: found.word,
                                phonetics: found.phonetic_symbol ? [{ text: found.phonetic_symbol }] : [],
                                chineseMeaning: found.mean,
                                chapter: found.sence || 'A'
                            };

                        wordDoc = new Word(wordData);
                        await wordDoc.save();
                        break;
                    }
                }
            }

            return wordDoc;
        } catch (error) {
            logger.error(`获取单词详情失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 批量获取单词详细信息
     * @param {Array<string>} words - 单词数组
     * @returns {Array<Object>} 单词详细信息数组
     */
    async getWordsDetail(words) {
        try {
            const wordDocs = await Word.find({ word: { $in: words } });
            const wordMap = new Map(wordDocs.map(doc => [doc.word, doc]));

            const result = [];
            for (const word of words) {
                if (wordMap.has(word)) {
                    result.push(wordMap.get(word));
                } else {
                    // 如果数据库中没有，尝试获取详细信息
                    const wordDetail = await this.getWordDetail(word);
                    if (wordDetail) {
                        result.push(wordDetail);
                    }
                }
            }

            return result;
        } catch (error) {
            logger.error(`批量获取单词详情失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 搜索单词
     * @param {string} keyword - 搜索关键词
     * @param {string} level - 词汇等级
     * @returns {Array} 匹配的单词列表
     */
    async searchWords(keyword, level = 'CET-4') {
        try {
            const vocabulary = await this.loadVocabulary(level);
            const results = [];

            for (const chapter in vocabulary) {
                const matches = vocabulary[chapter].filter(w => {
                    const wordText = typeof w === 'string' ? w : w.word;
                    return wordText.toLowerCase().includes(keyword.toLowerCase());
                });

                results.push(...matches);
            }

            return results.slice(0, 50); // 限制返回50个结果
        } catch (error) {
            logger.error(`搜索单词失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取用户学习进度
     * @param {string} userId - 用户ID
     * @returns {Object} 学习进度信息
     */
    async getUserProgress(userId) {
        try {
            const userWords = await UserWord.find({ userId });
            const totalWords = userWords.length;
            const learnedWords = userWords.filter(w => w.status === 'know').length;
            const learningWords = userWords.filter(w => w.status === 'learning').length;
            const difficultWords = userWords.filter(w => w.status === 'difficult').length;

            return {
                total: totalWords,
                learned: learnedWords,
                learning: learningWords,
                difficult: difficultWords,
                progress: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0
            };
        } catch (error) {
            logger.error(`获取用户学习进度失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 清除缓存
     * @param {string} level - 词汇等级（可选）
     */
    clearCache(level) {
        if (level) {
            this.vocabularyCache.delete(level);
            this.cacheExpiry.delete(level);
            logger.info(`清除词汇缓存: ${level}`);
        } else {
            this.vocabularyCache.clear();
            this.cacheExpiry.clear();
            logger.info('清除所有词汇缓存');
        }
    }
}

// 导出单例
module.exports = new VocabularyService();
