
/**
 * 词汇库管理工具配置文件
 */

module.exports = {
    // 缓存配置
    cache: {
        duration: 24 * 60 * 60 * 1000, // 缓存时长（毫秒）
        maxSize: 1000, // 最大缓存条目数
        checkInterval: 60 * 60 * 1000 // 缓存检查间隔（毫秒）
    },

    // 数据库配置
    database: {
        connectionTimeout: 10000, // 连接超时时间（毫秒）
        queryTimeout: 30000, // 查询超时时间（毫秒）
        batchSize: 1000, // 批量操作大小
        retryAttempts: 3, // 重试次数
        retryDelay: 1000 // 重试延迟（毫秒）
    },

    // 导入配置
    import: {
        batchSize: 100, // 每批导入的单词数
        skipDuplicates: true, // 是否跳过重复单词
        validateData: true, // 是否验证数据
        updateExisting: true, // 是否更新已存在的单词
        logProgress: true, // 是否记录进度
        progressInterval: 1000 // 进度记录间隔（毫秒）
    },

    // 导出配置
    export: {
        batchSize: 1000, // 每批导出的单词数
        format: 'json', // 导出格式
        indent: 2, // JSON缩进空格数
        includeMetadata: true, // 是否包含元数据
        compress: false // 是否压缩输出
    },

    // 数据标准化配置
    normalization: {
        validateFields: true, // 是否验证字段
        normalizePhonetics: true, // 是否标准化音标
        normalizeMeanings: true, // 是否标准化释义
        removeDuplicates: true, // 是否删除重复单词
        generateReports: true, // 是否生成报告
        reportFormat: 'txt' // 报告格式
    },

    // 数据库优化配置
    optimization: {
        createIndexes: true, // 是否创建索引
        optimizeData: true, // 是否优化数据
        cleanupInvalid: true, // 是否清理无效数据
        analyzePerformance: true, // 是否分析性能
        maxRetryAttempts: 3 // 最大重试次数
    },

    // 词汇数据配置
    vocabulary: {
        defaultLevel: 'CET-4', // 默认词汇等级
        defaultChapter: 'A', // 默认章节
        defaultScenario: 'general', // 默认场景
        supportedLevels: ['CET-4', 'CET-6', 'PEE'], // 支持的词汇等级
        supportedChapters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], // 支持的章节
        supportedScenarios: ['hotel', 'restaurant', 'shopping', 'travel', 'general'] // 支持的场景
    },

    // 日志配置
    logging: {
        level: 'info', // 日志级别
        directory: './logs', // 日志目录
        filename: 'vocabulary-manager.log', // 日志文件名
        maxSize: '10m', // 单个日志文件最大大小
        maxFiles: 5 // 最多保留的日志文件数
    },

    // API配置
    api: {
        baseUrl: '/api/vocabulary', // API基础路径
        timeout: 30000, // API超时时间（毫秒）
        retryAttempts: 3, // 重试次数
        retryDelay: 1000 // 重试延迟（毫秒）
    },

    // 性能配置
    performance: {
        enableProfiling: false, // 是否启用性能分析
        profileInterval: 60000, // 性能分析间隔（毫秒）
        maxMemoryUsage: 512, // 最大内存使用（MB）
        gcInterval: 300000 // 垃圾回收间隔（毫秒）
    },

    // 错误处理配置
    errorHandling: {
        logErrors: true, // 是否记录错误
        throwOnCritical: true, // 遇到严重错误是否抛出异常
        continueOnWarning: true, // 遇到警告是否继续
        maxErrorCount: 100 // 最大错误记录数
    }
};
