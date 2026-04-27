# 用户模块 README

## 模块功能说明

用户模块负责账号体系和用户基础状态管理，包括：

- 用户注册
- 用户登录
- 用户退出
- 用户信息获取
- 用户信息修改
- 头像上传
- 当前学习场景切换
- 用户整体学习进度查询
- 签到状态与连续天数维护

该模块是其他业务模块的基础。后端除登录、注册外，大多数 `/api/*` 接口都需要通过 session 鉴权。

## 主要接口/API

挂载路径：

```text
/api/auth
```

主要接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户退出 |
| GET | `/api/auth/info` | 获取当前登录用户信息 |
| POST | `/api/auth/changeinfo` | 修改用户信息、学习偏好、关卡状态等 |
| POST | `/api/auth/upload-avatar` | 上传用户头像 |
| POST | `/api/auth/switch-chapter` | 切换当前学习章节 |
| GET | `/api/auth/user/progress` | 获取用户学习进度 |

签到相关接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/checkin/daily` | 每日签到 |
| GET | `/api/checkin/status` | 获取签到状态 |

## 数据结构/数据库设计

核心模型：

```text
server/modules/User.js
```

主要字段：

```js
{
  username: String,
  password: String,
  avatar: String,
  cet4: {
    position: String,
    lastStudyTime: Date,
    learnedWords: Number,
    todayStudiedWords: Number,
    streakDays: Number,
    lastStudyDate: Date
  },
  chapters: Map, // 多场景关卡状态
  currentChapter: String,
  totalWords: Number,
  studyHistory: [{ date: Date, words: Number }],
  planReviweWords: Number,
  planStudyWords: Number,
  checkIn: {
    lastCheckInDate: Date,
    continuousCheckInDays: Number,
    totalCheckInDays: Number,
    checkInRewards: Map
  }
}
```

章节进度字段：

```js
{
  wordP: Boolean,     // 词汇学习
  spellP: Boolean,    // 拼写练习
  listenP: Boolean,   // 听力训练
  customsP: Boolean,  // AI 题目
  coverP: Boolean     // 实战对话
}
```

## 核心逻辑说明

- 登录成功后，后端通过 `express-session` 写入 `req.session.userid` 和登录状态。
- 后端在 `server/app.js` 中通过 `requireAuth` 保护 `/api/*` 下的大部分业务接口。
- 用户学习场景由 `currentChapter` 标识，当前已有 `A`、`B` 两个场景。
- 闯关进度写入 `chapters` Map，不同场景之间独立维护关卡完成状态。
- 签到数据写入 `User.checkIn`，学习报告会读取其中的连续天数和总签到天数。

## 与其他模块的关系

- 单词学习模块依赖 `User.currentChapter` 和 `User.cet4.position`。
- 闯关模块依赖 `User.chapters` 判断关卡解锁。
- 学习报告模块读取 `User.checkIn` 和 `User.studyHistory`。
- 好友模块通过 `User` 查询用户基础资料、头像和学习统计。
- AI 对话模块使用 `userid` 关联用户会话和历史记录。
