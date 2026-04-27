# 复习与学习报告模块 README

## 模块功能说明

复习与学习报告模块负责长期学习闭环，包括待复习单词、复习计划、每日学习记录、趋势统计、学习效率、成就和学习质量诊断。

主要能力：

- 获取复习计划
- 获取复习统计
- 记录学习活动
- 获取每日学习报告
- 获取学习趋势
- 获取效率趋势
- 获取历史对比
- 获取成就
- 获取学习建议
- 获取学习质量诊断

## 主要接口/API

### 复习计划

挂载路径：

```text
/api/reviewPlan
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/reviewPlan/getReviewSchedule` | 获取复习日程 |
| GET | `/api/reviewPlan/getReviewStats` | 获取复习统计 |

### 学习报告

挂载路径：

```text
/api/report
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/report/record` | 记录学习活动 |
| GET | `/api/report/daily` | 获取每日学习报告 |
| GET | `/api/report/trend` | 获取学习进度趋势 |
| GET | `/api/report/efficiency-trend` | 获取学习效率趋势 |
| GET | `/api/report/historical-comparison` | 获取历史对比 |
| GET | `/api/report/achievements` | 获取成就 |
| GET | `/api/report/suggestions` | 获取学习建议 |
| GET | `/api/report/quality` | 获取学习质量诊断 |

### 学习记录兼容接口

挂载路径：

```text
/api/study-record
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/study-record/vocabulary` | 记录词汇学习 |
| POST | `/api/study-record/listening` | 记录听力练习 |
| POST | `/api/study-record/spelling` | 记录拼写练习 |
| POST | `/api/study-record/ai-practice` | 记录 AI 练习 |

## 数据结构/数据库设计

### StudyRecord

文件：

```text
server/modules/StudyRecord.js
```

字段：

```js
{
  userId: String,
  date: Date,
  totalStudyTime: Number,
  moduleStudyTime: {
    vocabulary: Number,
    listening: Number,
    spelling: Number,
    aiPractice: Number
  },
  wordsLearned: {
    newWords: Number,
    reviewWords: Number
  },
  practiceStats: {
    spellingAccuracy: Number,
    listeningCompletion: Number,
    aiPracticeCount: Number
  },
  efficiency: {
    wordsPerMinute: Number,
    masteryRate: Number,
    masterySpeed: Number
  },
  sessions: [{
    startTime: Date,
    endTime: Date,
    module: String,
    wordsCount: Number,
    accuracy: Number
  }]
}
```

索引：

```js
{ userId: 1, date: -1 }
```

### UserWord

复习状态依赖 `UserWord`：

```js
{
  status: String,
  reviewCounts: Number,
  nextReviewTime: Date,
  priority: Number
}
```

## 核心逻辑说明

- 前端完成词汇、拼写、听力、AI 练习后调用 `/api/report/record` 写入学习活动。
- 每日学习报告按用户和日期查询 `StudyRecord`。
- 报告读取层会对字段做默认值和数值规范化，避免空数据导致前端误判。
- 掌握率优先根据 `UserWord.status` 和 `reviewCounts` 计算。
- 拼写正确率和听力完成率通过对应模块的学习 session 计算。
- 学习质量诊断基于学习时长、正确率、听力完成率、应用练习等指标综合生成。

## 与其他模块的关系

- 单词学习模块写入词汇学习记录和复习状态。
- 闯关模块在完成各关卡后写入不同模块的学习记录。
- AI 对话模块可写入 AI 练习次数和学习时长。
- 用户模块提供签到天数和学习历史。
- 前端完整报告页使用该模块展示日报、趋势图和质量诊断。
