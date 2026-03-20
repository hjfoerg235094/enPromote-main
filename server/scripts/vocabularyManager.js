
#!/usr/bin/env node

const { program } = require('commander');
const VocabularyDataManager = require('./vocabularyDataManager');
const VocabularyDbOptimizer = require('./vocabularyDbOptimizer');
const VocabularyDataImporter = require('./vocabularyDataImporter');
const VocabularyDataExporter = require('./vocabularyDataExporter');
const { logger } = require('../utils/logger');

program
  .name('vocabulary-manager')
  .description('词汇库管理工具')
  .version('1.0.0');

// 数据标准化命令
program
  .command('normalize')
  .description('标准化词汇数据')
  .option('-f, --file <file>', '指定要处理的词汇文件')
  .option('-a, --all', '处理所有词汇文件')
  .action(async (options) => {
    try {
      const manager = new VocabularyDataManager();

      if (options.all) {
        console.log('开始处理所有词汇文件...');
        manager.processAllVocabularyFiles();
      } else if (options.file) {
        console.log(`开始处理词汇文件: ${options.file}`);
        const processed = manager.processVocabularyFile(options.file);
        const outputPath = options.file.replace('.json', '_processed.json');
        manager.saveVocabulary(processed, outputPath);

        const report = manager.generateQualityReport(options.file);
        const reportPath = options.file.replace('.json', '_report.txt');
        require('fs').writeFileSync(reportPath, report, 'utf-8');

        console.log(`处理完成，结果保存到: ${outputPath}`);
        console.log(`质量报告保存到: ${reportPath}`);
      } else {
        console.error('请指定要处理的文件或使用 --all 选项处理所有文件');
        process.exit(1);
      }
    } catch (error) {
      console.error('处理失败:', error.message);
      process.exit(1);
    }
  });

// 数据质量分析命令
program
  .command('analyze')
  .description('分析词汇数据质量')
  .option('-f, --file <file>', '指定要分析的词汇文件')
  .action(async (options) => {
    try {
      const manager = new VocabularyDataManager();

      if (!options.file) {
        console.error('请指定要分析的文件');
        process.exit(1);
      }

      const report = manager.generateQualityReport(options.file);
      console.log(report);
    } catch (error) {
      console.error('分析失败:', error.message);
      process.exit(1);
    }
  });

// 数据库优化命令
program
  .command('optimize')
  .description('优化数据库')
  .option('-i, --index', '只创建索引')
  .option('-d, --data', '只优化数据')
  .action(async (options) => {
    try {
      const optimizer = new VocabularyDbOptimizer();
      await optimizer.connect();

      if (options.index) {
        console.log('开始创建索引...');
        await optimizer.createWordIndexes();
        await optimizer.createUserWordIndexes();
        console.log('索引创建完成');
      } else if (options.data) {
        console.log('开始优化数据...');
        await optimizer.optimizeWordData();
        await optimizer.optimizeUserWordData();
        console.log('数据优化完成');
      } else {
        console.log('开始全面优化...');
        await optimizer.optimizeAll();
        console.log('全面优化完成');
      }

      await optimizer.close();
    } catch (error) {
      console.error('优化失败:', error.message);
      process.exit(1);
    }
  });

// 数据导入命令
program
  .command('import')
  .description('导入词汇数据到数据库')
  .option('-f, --file <file>', '指定要导入的词汇文件')
  .option('-l, --level <level>', '指定词汇等级')
  .option('-a, --all', '导入所有词汇文件')
  .action(async (options) => {
    try {
      const importer = new VocabularyDataImporter();
      await importer.connect();

      if (options.all) {
        console.log('开始导入所有词汇文件...');
        await importer.importAllVocabularyFiles();
      } else if (options.file && options.level) {
        console.log(`开始导入词汇文件: ${options.file}`);
        await importer.importVocabularyFile(options.file, options.level);
      } else {
        console.error('请指定要导入的文件和等级，或使用 --all 选项导入所有文件');
        await importer.close();
        process.exit(1);
      }

      importer.printStats();
      await importer.close();
    } catch (error) {
      console.error('导入失败:', error.message);
      process.exit(1);
    }
  });

// 数据导出命令
program
  .command('export')
  .description('从数据库导出词汇数据')
  .option('-l, --level <level>', '指定词汇等级')
  .option('-c, --chapter <chapter>', '指定章节')
  .option('-o, --output <file>', '指定输出文件路径')
  .option('-a, --all', '导出所有词汇数据')
  .action(async (options) => {
    try {
      const exporter = new VocabularyDataExporter();
      await exporter.connect();

      if (options.all) {
        console.log('开始导出所有词汇数据...');
        await exporter.exportAllVocabulary();
      } else if (options.level) {
        const outputPath = options.output || `./vocabulary/${options.level}_exported.json`;

        if (options.chapter) {
          console.log(`开始导出章节词汇数据: ${options.level} - ${options.chapter}`);
          await exporter.exportChapter(options.level, options.chapter, outputPath);
        } else {
          console.log(`开始导出词汇数据: ${options.level}`);
          await exporter.exportVocabulary(options.level, outputPath);
        }
      } else {
        console.error('请指定词汇等级，或使用 --all 选项导出所有数据');
        await exporter.close();
        process.exit(1);
      }

      exporter.printStats();
      await exporter.close();
    } catch (error) {
      console.error('导出失败:', error.message);
      process.exit(1);
    }
  });

// 查看帮助信息
program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    program.help();
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.help();
}
