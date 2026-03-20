
# 词汇库服务

本目录包含词汇库相关的服务模块，用于管理和处理词汇数据。

## 目录结构

- `vocabularyService.js` - 词汇服务模块，提供词汇数据的获取和处理功能
- `vocabularyDataManager.js` - 词汇数据管理工具，用于数据标准化和质量分析
- `vocabularyDbOptimizer.js` - 数据库优化工具，用于优化数据库结构和性能

## 使用方法

### 1. 词汇服务 (vocabularyService.js)

词汇服务模块提供了以下功能：

- 加载词汇数据（带缓存）
- 获取指定章节的单词列表
- 获取单词详细信息
- 批量获取单词详细信息
- 搜索单词
- 获取用户学习进度
- 清除缓存

#### 示例代码

```javascript
const vocabularyService = require('./vocabularyService');

// 获取章节单词列表
const words = await vocabularyService.getWordsByChapter('CET-4', 'A', 0, 20);

// 获取单词详情
const wordDetail = await vocabularyService.getWordDetail('abandon');

// 搜索单词
const results = await vocabularyService.searchWords('ab', 'CET-4');

// 获取用户学习进度
const progress = await vocabularyService.getUserProgress(userId);

// 清除缓存
vocabularyService.clearCache('CET-4');
```

### 2. 词汇数据管理工具 (vocabularyDataManager.js)

词汇数据管理工具提供了以下功能：

- 标准化词汇数据格式
- 验证单词数据有效性
- 处理词汇文件
- 合并多个词汇文件
- 分析词汇数据质量
- 生成质量报告

#### 使用方法

```bash
# 处理所有词汇文件
node scripts/vocabularyDataManager.js
```

#### 示例代码

```javascript
const VocabularyDataManager = require('./scripts/vocabularyDataManager');
const manager = new VocabularyDataManager();

// 处理词汇文件
const processed = manager.processVocabularyFile('./vocabulary/CET-4.json');

// 分析词汇数据质量
const analysis = manager.analyzeVocabularyQuality('./vocabulary/CET-4.json');

// 生成质量报告
const report = manager.generateQualityReport('./vocabulary/CET-4.json');
console.log(report);
```

### 3. 数据库优化工具 (vocabularyDbOptimizer.js)

数据库优化工具提供了以下功能：

- 创建Word模型索引
- 创建UserWord模型索引
- 优化Word模型数据
- 优化UserWord模型数据

#### 使用方法

```bash
# 运行数据库优化工具
node scripts/vocabularyDbOptimizer.js
```

#### 示例代码

```javascript
const VocabularyDbOptimizer = require('./scripts/vocabularyDbOptimizer');
const optimizer = new VocabularyDbOptimizer();

// 连接数据库
await optimizer.connect();

// 创建索引
await optimizer.createWordIndexes();
await optimizer.createUserWordIndexes();

// 优化数据
await optimizer.optimizeWordData();
await optimizer.optimizeUserWordData();

// 执行所有优化
await optimizer.optimizeAll();
```

## API接口

词汇库系统提供了以下API接口：

- `GET /api/vocabulary/words` - 获取单词列表
- `GET /api/vocabulary/word/:word` - 获取单词详细信息
- `POST /api/vocabulary/words/batch` - 批量获取单词详细信息
- `GET /api/vocabulary/search` - 搜索单词
- `GET /api/vocabulary/progress` - 获取用户学习进度
- `POST /api/vocabulary/word/status` - 更新用户单词学习状态
- `GET /api/vocabulary/review` - 获取需要复习的单词
- `POST /api/vocabulary/cache/clear` - 清除词汇缓存

详细的API文档请参考 `词汇库管理指南.md`

## 维护建议

### 定期维护任务

1. **每周任务**：
   - 检查词汇数据质量报告
   - 清理无效数据
   - 更新词汇缓存

2. **每月任务**：
   - 运行数据库优化工具
   - 分析用户学习数据
   - 优化推荐算法

3. **每季度任务**：
   - 更新词汇数据
   - 评估系统性能
   - 优化索引策略

### 性能优化

1. **缓存策略**：
   - 词汇数据缓存24小时
   - 可根据实际需求调整缓存时间
   - 使用 `/api/vocabulary/cache/clear` 接口手动清除缓存

2. **数据库索引**：
   - 定期运行数据库优化工具
   - 监控慢查询
   - 根据实际查询模式优化索引

## 注意事项

1. **数据备份**：
   - 定期备份JSON词汇文件
   - 备份MongoDB数据库
   - 保留多个版本的备份

2. **数据一致性**：
   - 确保JSON文件和MongoDB数据的一致性
   - 使用数据管理工具标准化数据格式
   - 定期检查数据质量

3. **性能监控**：
   - 监控API响应时间
   - 监控数据库查询性能
   - 监控缓存命中率

## 故障排除

### 常见问题

1. **词汇数据加载失败**：
   - 检查JSON文件路径是否正确
   - 检查JSON文件格式是否正确
   - 查看服务器日志获取详细错误信息

2. **数据库连接失败**：
   - 检查数据库连接配置
   - 确保数据库服务正在运行
   - 检查网络连接

3. **API响应缓慢**：
   - 检查数据库索引是否正常
   - 检查缓存是否生效
   - 运行数据库优化工具

## 更多信息

详细的词汇库管理指南请参考项目根目录下的 `词汇库管理指南.md` 文件。
