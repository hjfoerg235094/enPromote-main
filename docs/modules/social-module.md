# 好友与社交模块 README

## 模块功能说明

好友与社交模块负责用户之间的关系、请求、好友列表、备注、屏蔽、排行和学习数据对比。

主要能力：

- 搜索用户
- 发送好友申请
- 接受/拒绝好友申请
- 获取好友列表
- 获取好友请求列表
- 删除好友
- 设置好友备注
- 屏蔽好友
- 获取社交设置
- 获取好友排行
- 与好友进行学习数据对比
- 好友聊天消息

## 主要接口/API

### 好友接口

挂载路径：

```text
/api/friends
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/friends/search` | 搜索用户 |
| POST | `/api/friends/request` | 发送好友申请 |
| POST | `/api/friends/accept` | 接受好友申请 |
| POST | `/api/friends/reject` | 拒绝好友申请 |
| GET | `/api/friends/list` | 获取好友列表 |
| GET | `/api/friends/requests` | 获取好友请求 |
| DELETE | `/api/friends/:friendId` | 删除好友 |
| POST | `/api/friends/remark` | 设置好友备注 |
| POST | `/api/friends/block` | 屏蔽好友 |
| GET | `/api/friends/settings` | 获取好友设置 |
| PUT | `/api/friends/settings` | 更新好友设置 |
| GET | `/api/friends/ranking` | 获取好友排行 |
| GET | `/api/friends/compare/:friendId` | 与好友学习对比 |

### 聊天接口

挂载路径：

```text
/api/chat
```

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/chat/messages/:friendId` | 获取与好友的消息 |
| POST | `/api/chat/send` | 发送消息 |
| GET | `/api/chat/conversations` | 获取会话列表 |
| POST | `/api/chat/read/:conversationId` | 标记已读 |
| DELETE | `/api/chat/conversation/:conversationId` | 删除会话 |

## 数据结构/数据库设计

### Friendship

文件：

```text
server/modules/Friendship.js
```

字段：

```js
{
  userId: String,
  friendId: String,
  status: 'pending' | 'accepted' | 'blocked',
  remark: String,
  createTime: Date,
  updateTime: Date
}
```

索引：

```js
{ userId: 1, status: 1 }
{ friendId: 1, status: 1 }
```

### FriendRequest

文件：

```text
server/modules/FriendRequest.js
```

字段：

```js
{
  fromUserId: String,
  toUserId: String,
  status: 'pending' | 'accepted' | 'rejected',
  message: String,
  createTime: Date,
  updateTime: Date
}
```

### ChatConversation / ChatMessage

文件：

```text
server/modules/ChatConversation.js
server/modules/ChatMessage.js
```

用于保存好友私聊会话和消息记录。

## 核心逻辑说明

- 好友申请先写入 `FriendRequest`。
- 接受申请后创建或更新 `Friendship` 关系。
- 好友列表基于 `Friendship.status = accepted` 查询。
- 排行和学习对比会读取用户学习统计、学习时长、单词数量等数据。
- 好友聊天通过会话和消息模型维护。

## 与其他模块的关系

- 用户模块提供用户资料、头像和身份信息。
- 学习报告模块提供学习时长、单词数量和趋势数据。
- 单词学习模块影响好友排行中的词汇学习数据。
- 聊天模块依赖好友关系确认消息可达性。
