
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Word = require('../modules/Word');
const { logger } = require('../utils/logger');

class VocabularyDataImporter {
    constructor() {
        this.vocabularyDir = path.join(__dirname, '..', 'vocabulary');
        this.wordDir = path.join(__dirname, '..', 'word');
        this.dbConnection = null;
        this.stats = {
            total: 0,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };
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
     * 从JSON文件加载词汇数据
     * @param {string} filePath - JSON文件路径
     * @returns {Object} 词汇数据
     */
    loadVocabularyFromFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.error(`加载词汇文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 转换单词数据格式
     * @param {Object} wordData - 原始单词数据
     * @param {string} level - 词汇等级
     * @param {string} chapter - 章节
     * @returns {Object} 转换后的单词数据
     */
    transformWordData(wordData, level, chapter) {
        // 处理字符串类型的单词
        if (typeof wordData === 'string') {
            return {
                word: wordData,
                phonetics: [],
                chineseMeaning: '',
                meanings: [],
                level: level,
                source: level,
                chapter: chapter,
                scenario: 'general'
            };
        }

        // 处理对象类型的单词
        const transformed = {
            word: wordData.word,
            phonetics: wordData.phonetic_symbol ? [{ text: wordData.phonetic_symbol }] : [],
            chineseMeaning: wordData.mean || '',
            meanings: [],
            level: level,
            source: level,
            chapter: wordData.sence || chapter,
            scenario: wordData.scenario || 'general'
        };

        // 处理例句
        if (wordData.examples && Array.isArray(wordData.examples)) {
            transformed.meanings = [{
                partOfSpeech: 'unknown',
                definitions: wordData.examples.map(ex => ({
                    definition: ex.meaning || wordData.mean || '',
                    example: ex.example || ex.sentence || ''
                }))
            }];
        } else if (wordData.example) {
            transformed.meanings = [{
                partOfSpeech: 'unknown',
                definitions: [{
                    definition: wordData.mean || '',
                    example: wordData.example
                }]
            }];
        }

        return transformed;
    }

    /**
     * 导入单个单词
     * @param {Object} wordData - 单词数据
     * @returns {Promise<Object>} 导入结果
     */
    async importWord(wordData) {
        try {
            this.stats.total++;

            // 检查单词是否已存在
            const existingWord = await Word.findOne({ word: wordData.word });

            if (existingWord) {
                // 更新现有单词
                await Word.updateOne(
                    { _id: existingWord._id },
                    { $set: wordData }
                );
                this.stats.updated++;
                logger.info(`更新单词: ${wordData.word}`);
                return { status: 'updated', word: wordData.word };
            } else {
                // 创建新单词
                const word = new Word(wordData);
                await word.save();
                this.stats.imported++;
                logger.info(`导入单词: ${wordData.word}`);
                return { status: 'imported', word: wordData.word };
            }
        } catch (error) {
            this.stats.skipped++;
            this.stats.errors.push({
                word: wordData.word,
                error: error.message
            });
            logger.error(`导入单词失败: ${wordData.word}, 错误: ${error.message}`);
            return { status: 'error', word: wordData.word, error: error.message };
        }
    }

    /**
     * 导入词汇文件
     * @param {string} filePath - 词汇文件路径
     * @param {string} level - 词汇等级
     */
    async importVocabularyFile(filePath, level) {
        try {
            logger.info(`开始导入词汇文件: ${filePath}`);

            const vocabulary = this.loadVocabularyFromFile(filePath);
            const chapters = Object.keys(vocabulary);

            logger.info(`找到 ${chapters.length} 个章节`);

            for (const chapter of chapters) {
                const words = vocabulary[chapter];
                logger.info(`处理章节 ${chapter}, 包含 ${words.length} 个单词`);

                for (const wordData of words) {
                    const transformed = this.transformWordData(wordData, level, chapter);
                    await this.importWord(transformed);
                }
            }

            logger.info(`词汇文件导入完成: ${filePath}`);
        } catch (error) {
            logger.error(`导入词汇文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 导入所有词汇文件
     */
    async importAllVocabularyFiles() {
        try {
            const files = fs.readdirSync(this.vocabularyDir);
            const jsonFiles = files.filter(file => 
                file.endsWith('.json') && !file.includes('_processed') && !file.includes('_report')
            );

            logger.info(`找到 ${jsonFiles.length} 个词汇文件`);

            for (const file of jsonFiles) {
                const level = file.replace('.json', '');
                const filePath = path.join(this.vocabularyDir, file);
                await this.importVocabularyFile(filePath, level);
            }

            // 输出统计信息
            this.printStats();
        } catch (error) {
            logger.error(`导入词汇文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 打印统计信息
     */
    printStats() {
        console.log('\n导入统计:');
        console.log('================');
        console.log(`总计: ${this.stats.total}`);
        console.log(`导入: ${this.stats.imported}`);
        console.log(`更新: ${this.stats.updated}`);
        console.log(`跳过: ${this.stats.skipped}`);

        if (this.stats.errors.length > 0) {
            console.log('\n错误列表:');
            this.stats.errors.forEach(err => {
                console.log(`- ${err.word}: ${err.error}`);
            });
        }
    }

    /**
     * 关闭数据库连接
     */
    async close() {
        if (this.dbConnection) {
            await this.dbConnection.close();
            logger.info('数据库连接已关闭');
        }
    }
}

// 如果直接运行此脚本，则导入所有词汇文件
if (require.main === module) {
    const importer = new VocabularyDataImporter();
    importer.connect()
        .then(() => importer.importAllVocabularyFiles())
        .then(() => importer.close())
        .then(() => {
            console.log('\n词汇数据导入完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('词汇数据导入失败:', error);
            process.exit(1);
        });
}

module.exports = VocabularyDataImporter;
