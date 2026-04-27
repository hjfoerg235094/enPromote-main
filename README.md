# LinguaQuest

LinguaQuest（语境闯关）是一个面向中文学习者的英语学习 Web 应用。项目以“场景闯关 + 单词学习 + AI 对话训练 + 学习复盘”为主线，支持用户在酒店、餐厅等真实语境中完成词汇识别、拼写、听力、AI 题目和实战对话训练，并通过学习报告、复习计划和好友系统辅助长期学习。

## 技术栈

### 前端

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Axios
- Element Plus
- 原生 CSS / scoped CSS

### 后端

- Node.js
- Express 5
- Mongoose
- express-session
- connect-mongo
- Multer
- Winston / Morgan

### 数据库与外部服务

- MongoDB：用户、单词、学习记录、好友关系、AI 会话等业务数据
- Redis：项目预留缓存能力
- DeepSeek / OpenAI 兼容接口：AI 对话、题目生成等能力
- 阿里云百炼 DashScope：部分 AI 题目生成场景
- 科大讯飞 ISE 或 Mock ISE：口语评测

## 项目结构

```text
enPromote-main/
├── frontend/                 # Vue 3 前端工程
│   ├── src/
│   │   ├── api/              # 前端接口封装
│   │   ├── assets/css/       # 全局与页面样式
│   │   ├── components/       # 复用组件
│   │   ├── router/           # 前端路由
│   │   ├── stores/           # Pinia 状态
│   │   └── views/            # 页面级组件
│   └── vite.config.ts
├── server/                   # Express 后端工程
│   ├── config/               # 服务与数据库配置
│   ├── modules/              # Mongoose 数据模型
│   ├── router/               # API 路由
│   ├── services/             # 外部服务与业务服务
│   ├── utils/                # 日志、缓存等工具
│   ├── word/                 # 词库数据
│   └── app.js                # 后端入口
├── public/                   # 静态资源
├── docs/modules/             # 模块级 README
├── .env.example              # 环境变量示例
└── package.json              # 根级依赖占位
```

## 核心功能

- 用户注册、登录、退出、头像上传、个人信息修改
- 场景闯关学习：词汇学习、拼写练习、听力训练、AI 题目、实战对话
- 单词学习与复习：单词状态、复习优先级、收藏、音频、例句生成
- AI 对话训练：自由对话、任务式场景对话、历史记录、对话复盘
- 口语评测：上传音频，对指定文本进行发音评分
- 学习报告：每日学习报告、趋势、效率、质量诊断、成就与建议
- 好友与社交：好友搜索、申请、接受/拒绝、好友排行、学习对比
- 角色剧情模式：基于故事任务的沉浸式英语应用训练

## 快速启动

### 1. 环境要求

- Node.js 18
- MongoDB
- npm
- 可选：Redis、AI API Key、讯飞 ISE 配置

### 2. 配置环境变量

复制根目录环境变量示例：

```bash
copy .env.example server/.env
```

按需修改：

```env
PORT=3000
HOST=localhost
DB_URL=mongodb://localhost:27017/EnglishMastery
SESSION_SECRET=your-session-secret
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=your-api-key
ALIYUN_BASE_URL=https://dashscope.aliyuncs.com
ALIYUN_API_KEY=your-aliyun-key
USE_MOCK_ISE=true
```

开发环境没有真实口语评测服务时，建议使用：

```env
USE_MOCK_ISE=true
```

### 3. 安装依赖

```bash
cd server
npm install

cd ../frontend
npm install
```

### 4. 启动后端

```bash
cd server
npm start
```

默认监听：

```text
http://localhost:3000
```

### 5. 启动前端

```bash
cd frontend
npm run dev
```

默认访问：

```text
http://localhost:5173
```

前端通过 Vite 代理访问后端 `/api/*` 接口。

## 构建与部署

### 前端构建

```bash
cd frontend
npm run build
```

构建产物默认输出到：

```text
frontend/dist/
```

### 后端部署

后端入口为：

```bash
node server/app.js
```

生产部署建议：

- 使用 PM2 或容器管理 Node.js 进程
- 设置 `NODE_ENV=production`
- 设置强随机 `SESSION_SECRET`
- 使用生产 MongoDB 地址
- 配置反向代理，将 `/api` 转发到后端服务
- 将前端 `dist` 交由 Nginx 或静态资源服务托管

## 项目截图

截图可放置在：

```text
docs/screenshots/
```

建议补充：

- 首页学习驾驶舱
- 场景任务大厅
- 当前场景训练台
- AI 对话训练
- 每日学习报告
- 好友排行与学习对比

## 模块文档

- [用户模块](docs/modules/user-module.md)
- [单词学习模块](docs/modules/vocabulary-module.md)
- [AI 对话模块](docs/modules/ai-chat-module.md)
- [闯关与角色剧情模块](docs/modules/adventure-story-module.md)
- [复习与学习报告模块](docs/modules/review-report-module.md)
- [好友与社交模块](docs/modules/social-module.md)

## 开发说明

- 大部分业务接口位于 `server/router/`
- 数据模型位于 `server/modules/`
- 前端页面位于 `frontend/src/views/`
- 前端 API 封装位于 `frontend/src/api/`
- 全局学习风格 CSS 变量位于 `frontend/src/assets/css/global.css`

## 已知注意事项

- 受保护后端接口统一经过 `app.use('/api', requireAuth)`，调用前必须登录。
- 口语评测依赖外部服务配置；开发阶段可使用 Mock 服务。
- 项目存在部分历史页面和旧版组件，维护时应优先使用当前核心路径页面。
