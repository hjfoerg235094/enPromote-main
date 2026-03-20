/**
 * 词汇库管理工具使用示例
 * 
 * 本脚本展示了如何使用词汇库管理工具的各种功能
 */

const VocabularyDataManager = require('./vocabularyDataManager');
const VocabularyDbOptimizer = require('./vocabularyDbOptimizer');
const VocabularyDataImporter = require('./vocabularyDataImporter');
const VocabularyDataExporter = require('./vocabularyDataExporter');
const vocabularyService = require('../services/vocabularyService');
const { logger } = require('../utils/logger');

async function example1_normalizeData() {
    console.log('\n示例1: 标准化词汇数据');
    console.log('======================');

    const manager = new VocabularyDataManager();

    // 处理所有词汇文件
    manager.processAllVocabularyFiles();

    // 或者处理特定文件
    // const processed = manager.processVocabularyFile('./vocabulary/CET-4.json');
    // manager.saveVocabulary(processed, './vocabulary/CET-4_processed.json');

    console.log('数据标准化完成');
}

async function example2_analyzeData() {
    console.log('\n示例2: 分析词汇数据质量');
    console.log('========================');

    const manager = new VocabularyDataManager();

    // 生成质量报告
    const report = manager.generateQualityReport('./vocabulary/CET-4.json');
    console.log(report);
}

async function example3_importData() {
    console.log('\n示例3: 导入词汇数据到数据库');
    console.log('============================');

    const importer = new VocabularyDataImporter();

    // 连接数据库
    await importer.connect();

    // 导入所有词汇文件
    await importer.importAllVocabularyFiles();

    // 或者导入特定文件
    // await importer.importVocabularyFile('./vocabulary/CET-4.json', 'CET-4');

    // 打印统计信息
    importer.printStats();

    // 关闭连接
    await importer.close();

    console.log('数据导入完成');
}

async function example4_exportData() {
    console.log('\n示例4: 从数据库导出词汇数据');
    console.log('============================');

    const exporter = new VocabularyDataExporter();

    // 连接数据库
    await exporter.connect();

    // 导出所有词汇数据
    await exporter.exportAllVocabulary();

    // 或者导出特定等级的词汇数据
    // await exporter.exportVocabulary('CET-4', './vocabulary/CET-4_exported.json');

    // 或者导出特定章节的词汇数据
    // await exporter.exportChapter('CET-4', 'A', './vocabulary/CET-4_A.json');

    // 打印统计信息
    exporter.printStats();

    // 关闭连接
    await exporter.close();

    console.log('数据导出完成');
}

async function example5_optimizeDatabase() {
    console.log('\n示例5: 优化数据库');
    console.log('==================');

    const optimizer = new VocabularyDbOptimizer();

    // 连接数据库
    await optimizer.connect();

    // 执行全面优化
    await optimizer.optimizeAll();

    // 或者分别执行优化操作
    // await optimizer.createWordIndexes();
    // await optimizer.createUserWordIndexes();
    // await optimizer.optimizeWordData();
    // await optimizer.optimizeUserWordData();

    // 关闭连接
    await optimizer.close();

    console.log('数据库优化完成');
}

async function example6_useVocabularyService() {
    console.log('\n示例6: 使用词汇服务');
    console.log('==================');

    // 获取章节单词列表
    const words = await vocabularyService.getWordsByChapter('CET-4', 'A', 0, 10);
    console.log(`获取到 ${words.words.length} 个单词`);

    // 获取单词详情
    const wordDetail = await vocabularyService.getWordDetail('abandon');
    if (wordDetail) {
        console.log(`单词详情: ${wordDetail.word} - ${wordDetail.chineseMeaning}`);
    }

    // 搜索单词
    const results = await vocabularyService.searchWords('ab', 'CET-4');
    console.log(`搜索到 ${results.length} 个匹配的单词`);

    // 清除缓存
    vocabularyService.clearCache('CET-4');

    console.log('词汇服务使用完成');
}

async function runAllExamples() {
    try {
        console.log('词汇库管理工具使用示例');
        console.log('======================\n');

        // 运行所有示例
        await example1_normalizeData();
        await example2_analyzeData();
        await example3_importData();
        await example4_exportData();
        await example5_optimizeDatabase();
        await example6_useVocabularyService();

        console.log('\n所有示例运行完成');
    } catch (error) {
        console.error('运行示例失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本，则运行所有示例
if (require.main === module) {
    runAllExamples()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('运行示例失败:', error);
            process.exit(1);
        });
}

// 导出各个示例函数，以便单独使用
module.exports = {
    example1_normalizeData,
    example2_analyzeData,
    example3_importData,
    example4_exportData,
    example5_optimizeDatabase,
    example6_useVocabularyService,
    runAllExamples
};
