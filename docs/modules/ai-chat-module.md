# AI 对话模块 README

## 模块功能说明

AI 对话模块提供自由聊天、任务式场景对话、AI 口语教练反馈和对话历史管理。它是项目中“把词汇用于真实语境”的核心模块。

主要能力：

- AI 自由对话
- 场景任务对话
- 任务会话开始、推进和结束
- 对话历史保存与删除
- 练习词获取
- AI 题目生成
- 口语教练反馈
- 口语评测音频上传与评分

## 主要接口/API

### AI 对话接口

挂载路径：

```text
/api/aiApi
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/aiApi/aiChat` | AI 对话 |
| GET | `/api/aiApi/history_messages` | 获取历史消息 |
| POST | `/api/aiApi/restartConversation` | 重启会话 |
| POST | `/api/aiApi/ai_generate_question` | AI 生成题目 |
| GET | `/api/aiApi/practice_words` | 获取练习词 |
| POST | `/api/aiApi/oralCoachFeedback` | 口语教练反馈 |
| POST | `/api/aiApi/startTaskChat` | 创建任务式对话会话 |
| POST | `/api/aiApi/taskChat` | 推进任务式对话 |
| GET | `/api/aiApi/getSessionStatus/:sessionId` | 查询任务会话状态 |
| POST | `/api/aiApi/endSession` | 结束任务会话 |
| POST | `/api/aiApi/saveChatMessage` | 保存聊天消息 |
| GET | `/api/aiApi/getChatHistory` | 获取聊天历史 |
| DELETE | `/api/aiApi/deleteChatSession` | 删除聊天会话 |

### 口语评测接口

挂载路径：

```text
/api/oral
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/oral/evaluate` | 单条口语评测 |
| POST | `/api/oral/batch-evaluate` | 批量口语评测 |
| GET | `/api/oral/config` | 获取评测配置 |

`/api/oral/evaluate` 使用 `multipart/form-data`：

```text
audio: 音频文件
text: 待评测文本
category: word/sentence/paragraph/free
level: primary/junior/senior/college
```

## 数据结构/数据库设计

### AiChatSession

文件：

```text
server/modules/AiChatSession.js
```

核心字段：

```js
{
  userid: ObjectId,
  scene: 'A' | 'B',
  chapter: 'A' | 'B',
  sessionId: String,
  status: 'active' | 'completed' | 'abandoned',
  tasks: [{
    id: Number,
    name: String,
    description: String,
    requiredWords: [String],
    completed: Boolean,
    usedWords: [String]
  }],
  progress: {
    tasksCompleted: Number,
    totalTasks: Number,
    wordsUsed: Number,
    turnCount: Number
  },
  messages: [{
    role: 'user' | 'assistant' | 'system',
    content: String,
    timestamp: Date,
    taskId: Number,
    wordsUsed: [String]
  }],
  completionReport: {
    totalDuration: Number,
    tasksCompletedCount: Number,
    wordsUsedCount: Number,
    turnCount: Number,
    performance: String,
    feedback: String
  }
}
```

### aiConversation

文件：

```text
server/modules/aiConversation.js
```

用于保存普通 AI 对话历史。

## 核心逻辑说明

- 普通对话接口负责即时问答，适合自由练习。
- 任务式对话使用 `AiChatSession` 保存任务、进度和消息。
- 任务完成判断通常基于任务完成数、使用词数量和对话轮次。
- 会话结束后生成 `completionReport`，用于复盘学习表现。
- 口语评测接口使用 `multer.memoryStorage()` 接收音频文件，并交给 ISE 服务评测。
- ISE 服务可通过环境变量选择真实服务或 Mock 服务：

```env
USE_MOCK_ISE=true
```

## 与其他模块的关系

- 单词学习模块提供练习词和复习词。
- 闯关模块第五关使用 AI 对话作为实战关。
- 复习报告模块可展示 AI 练习次数、学习质量和薄弱点。
- 角色剧情模块可复用 AI 对话和反馈能力。
- 用户模块提供当前章节、用户身份和会话隔离。
