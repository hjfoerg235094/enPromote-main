# 闯关与角色剧情模块 README

## 模块功能说明

闯关与角色剧情模块负责项目的主学习路径。它将英语学习拆成场景任务，并通过 5 个能力关卡引导用户从“认识单词”过渡到“真实表达”。

当前产品定位：

- `/chapters`：场景选择、分类和推荐
- `/adventure`：当前场景训练台
- `/story`：完成训练后的角色剧情实战

核心训练链路：

```text
词汇学习 -> 拼写练习 -> 听力训练 -> AI 题目 -> 实战对话 -> 角色剧情
```

## 主要接口/API

闯关模块本身主要复用用户、单词、AI、报告和剧情接口。

### 用户与章节状态

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/switch-chapter` | 切换当前场景 |
| POST | `/api/auth/changeinfo` | 更新关卡完成状态 |
| GET | `/api/auth/info` | 获取当前用户和章节进度 |

### 单词与训练

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/word/getWordList` | 获取场景词汇 |
| GET | `/api/word/getReviewWords` | 获取复习词，用于听力和 AI 练习 |
| POST | `/api/word/submitReview` | 提交词汇识别结果 |
| POST | `/api/word/updateWordProgress` | 更新词汇学习进度 |
| GET | `/api/word/getWordAudio` | 获取单词音频 |

### AI 题目与实战对话

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/question/generate` | 生成 AI 题目 |
| POST | `/api/aiApi/startTaskChat` | 开始任务式场景对话 |
| POST | `/api/aiApi/taskChat` | 进行任务式对话 |
| POST | `/api/aiApi/endSession` | 结束实战对话 |

### 角色剧情

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/story/list` | 获取故事列表 |
| GET | `/api/story/:storyId` | 获取故事详情 |
| GET | `/api/story/:storyId/chapter/:chapterId` | 获取剧情章节 |
| POST | `/api/story/:storyId/chapter/:chapterId/task/:taskId/dialogue` | 剧情对话任务 |
| GET | `/api/story/:storyId/chapter/:chapterId/task/:taskId/spelling` | 剧情拼写任务 |
| GET | `/api/story/:storyId/chapter/:chapterId/task/:taskId/listening` | 剧情听力任务 |
| GET | `/api/story/:storyId/chapter/:chapterId/task/:taskId/reading` | 剧情阅读任务 |
| POST | `/api/story/:storyId/chapter/:chapterId/task/:taskId/complete` | 完成剧情任务 |

## 数据结构/数据库设计

### User.chapters

用户每个场景的训练进度保存在 `User.chapters`：

```js
chapters: {
  A: {
    wordP: Boolean,
    spellP: Boolean,
    listenP: Boolean,
    customsP: Boolean,
    coverP: Boolean,
    level: Number,
    score: Number,
    completedWords: Number
  },
  B: { ... }
}
```

字段说明：

- `wordP`：词汇学习是否完成
- `spellP`：拼写练习是否完成
- `listenP`：听力训练是否完成
- `customsP`：AI 题目是否完成
- `coverP`：实战对话是否完成

### StoryProgress

剧情进度模型位于：

```text
server/modules/StoryProgress.js
server/models/StoryProgress.js
```

用于保存用户在故事、章节和任务维度上的完成状态、表现评分和任务记录。

## 核心逻辑说明

### 场景选择

`/chapters` 负责展示场景分类、推荐场景和当前主线，不直接执行训练。点击场景后调用 `switchChapter` 并进入 `/adventure`。

### 当前场景训练台

`/adventure` 根据 `User.currentChapter` 和 `User.chapters[currentChapter]` 渲染 5 关状态：

- 已完成：允许重练
- 当前建议：推荐用户点击主按钮继续
- 未解锁：需要完成上一关

### 关卡完成

每个关卡完成后调用 `changeInfo({ [levelKey]: true })` 更新用户章节状态。

同时根据关卡类型写入学习报告：

- 词汇学习 -> `module = vocabulary`
- 拼写练习 -> `module = spelling`
- 听力训练 -> `module = listening`
- AI 题目/对话 -> `module = aiPractice`

### 角色剧情解锁

当 5 个关卡全部完成后，前端显示剧情入口。角色剧情被定位为“训练完成后的实战奖励”，不与主线闯关并列抢入口。

## 与其他模块的关系

- 用户模块提供当前章节和关卡状态。
- 单词学习模块提供词汇、复习词、音频和单词状态。
- AI 对话模块提供 AI 题目和实战对话能力。
- 复习报告模块记录每关学习数据并生成日报。
- 角色剧情模块复用单词、听力、拼写和 AI 对话能力。
