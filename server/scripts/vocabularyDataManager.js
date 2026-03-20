
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class VocabularyDataManager {
    constructor() {
        this.vocabularyDir = path.join(__dirname, '..', 'vocabulary');
        this.wordDir = path.join(__dirname, '..', 'word');
    }

    /**
     * 标准化词汇数据格式
     * @param {Object} wordData - 原始单词数据
     * @returns {Object} 标准化后的单词数据
     */
    normalizeWordData(wordData) {
        // 处理字符串类型的单词
        if (typeof wordData === 'string') {
            return {
                word: wordData,
                mean: '',
                phonetic_symbol: '',
                initial: wordData.charAt(0).toUpperCase(),
                sence: 'A',
                difficulty: 1,
                tags: []
            };
        }

        // 处理对象类型的单词
        return {
            word: wordData.word || '',
            mean: wordData.mean || wordData.meaning || '',
            phonetic_symbol: wordData.phonetic_symbol || wordData.phonetics || '',
            initial: wordData.initial || (wordData.word ? wordData.word.charAt(0).toUpperCase() : ''),
            sence: wordData.sence || wordData.chapter || 'A',
            difficulty: wordData.difficulty || 1,
            tags: wordData.tags || [],
            examples: wordData.examples || wordData.example || []
        };
    }

    /**
     * 验证单词数据
     * @param {Object} wordData - 单词数据
     * @returns {boolean} 是否有效
     */
    validateWordData(wordData) {
        if (!wordData.word || typeof wordData.word !== 'string') {
            return false;
        }
        if (!wordData.mean && !wordData.meaning) {
            return false;
        }
        return true;
    }

    /**
     * 处理词汇文件
     * @param {string} filePath - 词汇文件路径
     * @returns {Object} 处理后的词汇数据
     */
    processVocabularyFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const vocabulary = JSON.parse(data);
            const processed = {};

            for (const chapter in vocabulary) {
                const words = vocabulary[chapter];
                const normalizedWords = words.map(word => {
                    const normalized = this.normalizeWordData(word);

                    if (!this.validateWordData(normalized)) {
                        logger.warn(`无效的单词数据: ${JSON.stringify(word)}`);
                        return null;
                    }

                    return normalized;
                }).filter(word => word !== null);

                processed[chapter] = normalizedWords;
            }

            return processed;
        } catch (error) {
            logger.error(`处理词汇文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 保存处理后的词汇数据
     * @param {Object} vocabulary - 词汇数据
     * @param {string} outputPath - 输出文件路径
     */
    saveVocabulary(vocabulary, outputPath) {
        try {
            fs.writeFileSync(outputPath, JSON.stringify(vocabulary, null, 2), 'utf-8');
            logger.info(`词汇数据保存成功: ${outputPath}`);
        } catch (error) {
            logger.error(`保存词汇数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 合并多个词汇文件
     * @param {Array<string>} filePaths - 词汇文件路径数组
     * @param {string} outputPath - 输出文件路径
     */
    mergeVocabularyFiles(filePaths, outputPath) {
        try {
            const merged = {};

            filePaths.forEach(filePath => {
                const vocabulary = this.processVocabularyFile(filePath);
                for (const chapter in vocabulary) {
                    if (!merged[chapter]) {
                        merged[chapter] = [];
                    }
                    merged[chapter].push(...vocabulary[chapter]);
                }
            });

            // 对每个章节的单词进行去重
            for (const chapter in merged) {
                const uniqueWords = new Map();
                merged[chapter].forEach(word => {
                    if (!uniqueWords.has(word.word)) {
                        uniqueWords.set(word.word, word);
                    }
                });
                merged[chapter] = Array.from(uniqueWords.values());
            }

            this.saveVocabulary(merged, outputPath);
            logger.info(`词汇文件合并成功: ${outputPath}`);
        } catch (error) {
            logger.error(`合并词汇文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 分析词汇数据质量
     * @param {string} filePath - 词汇文件路径
     * @returns {Object} 分析结果
     */
    analyzeVocabularyQuality(filePath) {
        try {
            const vocabulary = this.processVocabularyFile(filePath);
            const analysis = {
                totalChapters: 0,
                totalWords: 0,
                validWords: 0,
                invalidWords: 0,
                chapters: {},
                issues: []
            };

            for (const chapter in vocabulary) {
                const words = vocabulary[chapter];
                analysis.totalChapters++;
                analysis.totalWords += words.length;

                const chapterAnalysis = {
                    total: words.length,
                    valid: 0,
                    invalid: 0,
                    hasPhonetic: 0,
                    hasMeaning: 0,
                    hasExample: 0
                };

                words.forEach(word => {
                    if (this.validateWordData(word)) {
                        chapterAnalysis.valid++;
                        analysis.validWords++;

                        if (word.phonetic_symbol) chapterAnalysis.hasPhonetic++;
                        if (word.mean) chapterAnalysis.hasMeaning++;
                        if (word.examples && word.examples.length > 0) chapterAnalysis.hasExample++;
                    } else {
                        chapterAnalysis.invalid++;
                        analysis.invalidWords++;
                        analysis.issues.push(`章节 ${chapter} 中的单词 ${word.word} 数据无效`);
                    }
                });

                analysis.chapters[chapter] = chapterAnalysis;
            }

            return analysis;
        } catch (error) {
            logger.error(`分析词汇数据质量失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 生成词汇数据质量报告
     * @param {string} filePath - 词汇文件路径
     * @returns {string} 报告内容
     */
    generateQualityReport(filePath) {
        const analysis = this.analyzeVocabularyQuality(filePath);

        let report = '词汇数据质量报告\n';
        report += '==================\n\n';
        report += `总章节数: ${analysis.totalChapters}\n`;
        report += `总单词数: ${analysis.totalWords}\n`;
        report += `有效单词: ${analysis.validWords}\n`;
        report += `无效单词: ${analysis.invalidWords}\n`;
        report += `数据完整率: ${analysis.totalWords > 0 ? ((analysis.validWords / analysis.totalWords) * 100).toFixed(2) : 0}%\n\n`;

        report += '各章节详情:\n';
        for (const chapter in analysis.chapters) {
            const info = analysis.chapters[chapter];
            report += `\n章节 ${chapter}:\n`;
            report += `  总单词数: ${info.total}\n`;
            report += `  有效单词: ${info.valid}\n`;
            report += `  无效单词: ${info.invalid}\n`;
            report += `  有音标: ${info.hasPhonetic} (${info.total > 0 ? ((info.hasPhonetic / info.total) * 100).toFixed(2) : 0}%)\n`;
            report += `  有释义: ${info.hasMeaning} (${info.total > 0 ? ((info.hasMeaning / info.total) * 100).toFixed(2) : 0}%)\n`;
            report += `  有例句: ${info.hasExample} (${info.total > 0 ? ((info.hasExample / info.total) * 100).toFixed(2) : 0}%)\n`;
        }

        if (analysis.issues.length > 0) {
            report += '\n问题列表:\n';
            analysis.issues.forEach(issue => {
                report += `- ${issue}\n`;
            });
        }

        return report;
    }

    /**
     * 处理所有词汇文件
     */
    processAllVocabularyFiles() {
        try {
            const files = fs.readdirSync(this.vocabularyDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            logger.info(`找到 ${jsonFiles.length} 个词汇文件`);

            jsonFiles.forEach(file => {
                const filePath = path.join(this.vocabularyDir, file);
                logger.info(`处理词汇文件: ${file}`);

                const processed = this.processVocabularyFile(filePath);
                const outputPath = path.join(this.vocabularyDir, `${file.replace('.json', '')}_processed.json`);
                this.saveVocabulary(processed, outputPath);

                const report = this.generateQualityReport(filePath);
                const reportPath = path.join(this.vocabularyDir, `${file.replace('.json', '')}_report.txt`);
                fs.writeFileSync(reportPath, report, 'utf-8');

                logger.info(`生成质量报告: ${reportPath}`);
            });

            logger.info('所有词汇文件处理完成');
        } catch (error) {
            logger.error(`处理词汇文件失败: ${error.message}`);
            throw error;
        }
    }
}

// 如果直接运行此脚本，则处理所有词汇文件
if (require.main === module) {
    const manager = new VocabularyDataManager();
    manager.processAllVocabularyFiles();
}

module.exports = VocabularyDataManager;
