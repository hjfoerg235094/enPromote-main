
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Word = require('../modules/Word');
const { logger } = require('../utils/logger');

class VocabularyDataExporter {
    constructor() {
        this.vocabularyDir = path.join(__dirname, '..', 'vocabulary');
        this.dbConnection = null;
        this.stats = {
            total: 0,
            exported: 0,
            chapters: {},
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
     * 转换单词数据格式
     * @param {Object} wordDoc - 数据库中的单词文档
     * @returns {Object} 转换后的单词数据
     */
    transformWordData(wordDoc) {
        const transformed = {
            word: wordDoc.word,
            mean: wordDoc.chineseMeaning || '',
            phonetic_symbol: '',
            initial: wordDoc.word.charAt(0).toUpperCase(),
            sence: wordDoc.chapter || 'A',
            difficulty: 1,
            tags: [],
            examples: []
        };

        // 处理音标
        if (wordDoc.phonetics && wordDoc.phonetics.length > 0) {
            transformed.phonetic_symbol = wordDoc.phonetics[0].text || '';
        }

        // 处理释义和例句
        if (wordDoc.meanings && wordDoc.meanings.length > 0) {
            const firstMeaning = wordDoc.meanings[0];
            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                // 使用第一个定义作为主要释义
                if (!transformed.mean && firstMeaning.definitions[0].definition) {
                    transformed.mean = firstMeaning.definitions[0].definition;
                }

                // 收集所有例句
                firstMeaning.definitions.forEach(def => {
                    if (def.example) {
                        transformed.examples.push({
                            sentence: def.example,
                            meaning: def.definition || ''
                        });
                    }
                });
            }
        }

        // 添加难度标签
        if (wordDoc.level) {
            transformed.tags.push(wordDoc.level);
        }

        // 添加场景标签
        if (wordDoc.scenario) {
            transformed.tags.push(wordDoc.scenario);
        }

        return transformed;
    }

    /**
     * 导出词汇数据到JSON文件
     * @param {string} level - 词汇等级
     * @param {string} outputPath - 输出文件路径
     */
    async exportVocabulary(level, outputPath) {
        try {
            logger.info(`开始导出词汇数据: ${level}`);

            // 查询指定等级的所有单词
            const words = await Word.find({ level: level }).sort({ word: 1 });

            logger.info(`找到 ${words.length} 个单词`);

            // 按章节组织单词
            const vocabulary = {};

            for (const wordDoc of words) {
                const chapter = wordDoc.chapter || 'A';
                if (!vocabulary[chapter]) {
                    vocabulary[chapter] = [];
                }

                const transformed = this.transformWordData(wordDoc);
                vocabulary[chapter].push(transformed);

                this.stats.exported++;

                // 统计各章节数量
                if (!this.stats.chapters[chapter]) {
                    this.stats.chapters[chapter] = 0;
                }
                this.stats.chapters[chapter]++;
            }

            // 确保输出目录存在
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 写入文件
            fs.writeFileSync(outputPath, JSON.stringify(vocabulary, null, 2), 'utf-8');

            logger.info(`词汇数据导出成功: ${outputPath}`);
            this.stats.total = words.length;
        } catch (error) {
            logger.error(`导出词汇数据失败: ${error.message}`);
            this.stats.errors.push({
                level: level,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 导出所有词汇数据
     */
    async exportAllVocabulary() {
        try {
            // 获取所有不同的词汇等级
            const levels = await Word.distinct('level');

            logger.info(`找到 ${levels.length} 个词汇等级: ${levels.join(', ')}`);

            for (const level of levels) {
                const outputPath = path.join(this.vocabularyDir, `${level}_exported.json`);
                await this.exportVocabulary(level, outputPath);
            }

            // 输出统计信息
            this.printStats();
        } catch (error) {
            logger.error(`导出词汇数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 导出指定章节的词汇数据
     * @param {string} level - 词汇等级
     * @param {string} chapter - 章节
     * @param {string} outputPath - 输出文件路径
     */
    async exportChapter(level, chapter, outputPath) {
        try {
            logger.info(`开始导出章节词汇数据: ${level} - ${chapter}`);

            // 查询指定等级和章节的所有单词
            const words = await Word.find({ 
                level: level, 
                chapter: chapter 
            }).sort({ word: 1 });

            logger.info(`找到 ${words.length} 个单词`);

            // 转换单词数据
            const vocabulary = {
                [chapter]: words.map(wordDoc => this.transformWordData(wordDoc))
            };

            // 确保输出目录存在
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 写入文件
            fs.writeFileSync(outputPath, JSON.stringify(vocabulary, null, 2), 'utf-8');

            logger.info(`章节词汇数据导出成功: ${outputPath}`);
            this.stats.total = words.length;
            this.stats.exported = words.length;
            this.stats.chapters[chapter] = words.length;
        } catch (error) {
            logger.error(`导出章节词汇数据失败: ${error.message}`);
            this.stats.errors.push({
                level: level,
                chapter: chapter,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 打印统计信息
     */
    printStats() {
        console.log('\n导出统计:');
        console.log('================');
        console.log(`总计: ${this.stats.total}`);
        console.log(`导出: ${this.stats.exported}`);

        if (Object.keys(this.stats.chapters).length > 0) {
            console.log('\n各章节统计:');
            for (const chapter in this.stats.chapters) {
                console.log(`  章节 ${chapter}: ${this.stats.chapters[chapter]} 个单词`);
            }
        }

        if (this.stats.errors.length > 0) {
            console.log('\n错误列表:');
            this.stats.errors.forEach(err => {
                console.log(`- ${err.level}${err.chapter ? ' - ' + err.chapter : ''}: ${err.error}`);
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

// 如果直接运行此脚本，则导出所有词汇数据
if (require.main === module) {
    const exporter = new VocabularyDataExporter();
    exporter.connect()
        .then(() => exporter.exportAllVocabulary())
        .then(() => exporter.close())
        .then(() => {
            console.log('\n词汇数据导出完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('词汇数据导出失败:', error);
            process.exit(1);
        });
}

module.exports = VocabularyDataExporter;
