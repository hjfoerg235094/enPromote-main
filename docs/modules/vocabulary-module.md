# 单词学习模块 README

## 模块功能说明

单词学习模块负责词库、词汇学习、单词状态、复习词、音频、收藏和场景关卡中的词汇训练。

主要能力：

- 按章节获取单词列表
- 获取用户当前单词学习进度
- 更新词汇学习进度
- 提交单词识别/复习结果
- 获取待复习单词
- 生成单词例句
- 获取单词音频
- 收藏/取消收藏单词
- 查询单词详情和搜索词汇

## 主要接口/API

核心挂载路径：

```text
/api/word
/api/vocabulary
/api/vocabulary-learning
/api/favoriteWords
```

### `/api/word`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/word/getWordProgress` | 获取用户当前词汇学习位置 |
| GET | `/api/word/getWordList` | 获取指定章节和索引的单词列表 |
| POST | `/api/word/updateWordProgress` | 更新词汇学习进度 |
| POST | `/api/word/submitReview` | 提交单词复习/识别结果 |
| GET | `/api/word/getReviewWords` | 获取待复习单词 |
| GET | `/api/word/getWordAudio` | 获取单词发音音频 |
| POST | `/api/word/generateExample` | 生成单词例句 |

### `/api/vocabulary`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/vocabulary/words` | 获取词汇列表 |
| GET | `/api/vocabulary/word/:word` | 查询单词详情 |
| POST | `/api/vocabulary/words/batch` | 批量获取单词 |
| GET | `/api/vocabulary/search` | 搜索单词 |
| GET | `/api/vocabulary/progress` | 获取词汇进度 |
| POST | `/api/vocabulary/word/status` | 更新单词状态 |
| GET | `/api/vocabulary/review` | 获取复习词 |

### `/api/favoriteWords`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/favoriteWords/list` | 收藏单词列表 |
| POST | `/api/favoriteWords/add` | 添加收藏 |
| POST | `/api/favoriteWords/remove` | 取消收藏 |
| GET | `/api/favoriteWords/check` | 查询收藏状态 |

## 数据结构/数据库设计

### Word

文件：

```text
server/modules/Word.js
```

典型字段：

```js
{
  word: String,
  phonetic_symbol: String,
  translations: Array,
  examples: Array,
  difficulty: Number,
  chapter: String
}
```

### UserWord

文件：

```text
server/modules/UserWord.js
```

字段：

```js
{
  userId: String,
  wordId: String,
  sence: String,
  status: String,
  reviewCounts: Number,
  firstSeenAt: Date,
  lastSeenAt: Date,
  nextReviewTime: Date,
  priority: Number,
  isFavorite: Boolean,
  source: 'vocabulary' | 'story'
}
```

索引：

```js
{ userId: 1, wordId: 1 }, unique: true
```

## 核心逻辑说明

- 用户词汇位置使用类似 `A:0` 的字符串表示，`A` 是章节，`0` 是当前索引。
- `getWordList` 根据章节和索引返回一批词，用于闯关第一关、拼写和听力等训练。
- `submitReview` 会根据 `newStatus` 更新用户单词状态，例如 `know`、`vague`、`unknown`。
- `UserWord.priority` 和 `nextReviewTime` 用于决定复习优先级。
- `updateWordProgress` 负责推进用户词汇位置，同时更新用户学习历史。
- 新版闯关流程中，词汇关完成后由前端单独调用学习报告接口记录真实学习时长，并通过 `skipStudyRecord` 避免重复估算日报。

## 与其他模块的关系

- 闯关学习模块使用单词列表支撑 5 关训练。
- 复习报告模块读取 `UserWord` 计算掌握率。
- AI 题目模块基于复习词或场景词生成题目。
- AI 对话模块会检查用户是否使用了目标词汇。
- 好友模块可基于用户学习词数进行排行和对比。
