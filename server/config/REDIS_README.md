
# Redis 集成指南

## 目录
- [Redis 简介](#redis-简介)
- [安装 Redis](#安装-redis)
- [配置 Redis](#配置-redis)
- [使用 Redis](#使用-redis)
- [应用场景](#应用场景)
- [注意事项](#注意事项)

## Redis 简介

Redis（Remote Dictionary Server）是一个开源的内存数据结构存储系统，可以用作数据库、缓存和消息中间件。它支持多种数据结构，如字符串、哈希、列表、集合、有序集合等。

### 为什么使用 Redis？

1. **高性能**：Redis 将数据存储在内存中，读写速度极快
2. **丰富的数据结构**：支持多种数据结构，适合不同场景
3. **原子操作**：所有操作都是原子性的，确保数据一致性
4. **持久化**：支持 RDB 和 AOF 两种持久化方式
5. **主从复制**：支持主从复制，提高可用性
6. **集群支持**：支持集群模式，实现水平扩展

## 安装 Redis

### Windows

1. 下载 Redis for Windows：
   - 访问：https://github.com/microsoftarchive/redis/releases
   - 下载最新版本的 .msi 安装包

2. 安装 Redis：
   - 双击下载的 .msi 文件，按照提示完成安装
   - 默认安装路径为：`C:\Program Files\Redis`

3. 启动 Redis 服务：
   ```bash
   # 使用服务管理器启动
   redis-server --service-start

   # 或直接启动 Redis 服务器
   redis-server
   ```

4. 验证 Redis 是否正常运行：
   ```bash
   redis-cli ping
   # 应该返回：PONG
   ```

### macOS

使用 Homebrew 安装：

```bash
# 安装 Redis
brew install redis

# 启动 Redis 服务
brew services start redis

# 验证 Redis 是否正常运行
redis-cli ping
```

### Linux (Ubuntu/Debian)

```bash
# 更新包列表
sudo apt update

# 安装 Redis
sudo apt install redis-server

# 启动 Redis 服务
sudo systemctl start redis

# 设置开机自启动
sudo systemctl enable redis

# 验证 Redis 是否正常运行
redis-cli ping
```

## 配置 Redis

### 1. 环境变量配置

在项目根目录下的 `.env` 文件中添加以下配置：

```bash
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

配置说明：
- `REDIS_HOST`: Redis 服务器地址，默认为 localhost
- `REDIS_PORT`: Redis 服务器端口，默认为 6379
- `REDIS_PASSWORD`: Redis 密码（如果设置了密码）
- `REDIS_DB`: Redis 数据库编号，默认为 0

### 2. Redis 配置文件（可选）

如果需要自定义 Redis 配置，可以修改 Redis 配置文件：

- Windows: `C:\Program Files\Redis\redis.windows.conf`
- macOS/Linux: `/etc/redis/redis.conf`

常用配置项：

```conf
# 绑定地址
bind 127.0.0.1

# 端口
port 6379

# 密码（取消注释并设置密码）
# requirepass your-password

# 数据库数量
databases 16

# 持久化配置
save 900 1
save 300 10
save 60 10000

# 最大内存限制（根据服务器内存调整）
maxmemory 256mb

# 内存淘汰策略
maxmemory-policy allkeys-lru
```

修改配置后，重启 Redis 服务使配置生效。

## 使用 Redis

### 1. 基础缓存操作

```javascript
const RedisCache = require('../utils/redisCache');

// 设置缓存
await RedisCache.set('key', { data: 'value' }, 3600); // 1小时后过期

// 获取缓存
const data = await RedisCache.get('key');

// 删除缓存
await RedisCache.del('key');

// 检查缓存是否存在
const exists = await RedisCache.exists('key');
```

### 2. 会话存储

项目已配置使用 Redis 存储会话，无需额外配置。会话数据将自动存储在 Redis 中，键前缀为 `session:`。

### 3. 学习报告缓存

```javascript
// 缓存用户学习报告
const cacheKey = `report:${userId}:${date}`;
await RedisCache.set(cacheKey, reportData, 86400); // 24小时

// 获取学习报告
const report = await RedisCache.get(cacheKey);
```

### 4. AI 对话缓存

```javascript
// 缓存 AI 对话上下文
const conversationKey = `ai:conversation:${userId}:${conversationId}`;
await RedisCache.set(conversationKey, context, 3600); // 1小时

// 获取对话上下文
const context = await RedisCache.get(conversationKey);
```

### 5. 单词学习状态缓存

```javascript
// 缓存用户待复习单词列表
const reviewKey = `review:words:${userId}`;
await RedisCache.set(reviewKey, wordList, 1800); // 30分钟

// 获取待复习单词
const words = await RedisCache.get(reviewKey);
```

### 6. 排行榜缓存

```javascript
// 使用有序集合实现排行榜
const leaderboardKey = 'game:leaderboard';

// 添加玩家分数
await RedisCache.zAdd(leaderboardKey, [
  { score: 100, value: { id: 'player1', name: '玩家1' } },
  { score: 200, value: { id: 'player2', name: '玩家2' } }
]);

// 获取排行榜（按分数降序）
const leaderboard = await RedisCache.zRange(leaderboardKey, 0, -1, true);
```

更多使用示例请参考 `utils/redisCacheExample.js` 文件。

## 应用场景

### 1. 会话存储 ⭐⭐⭐⭐⭐
- 存储用户会话数据
- 自动过期，无需手动清理
- 读写速度快，提升用户体验

### 2. AI 对话缓存 ⭐⭐⭐⭐⭐
- 缓存常见问题的回答
- 存储对话上下文
- 减少 API 调用次数

### 3. 学习报告缓存 ⭐⭐⭐⭐
- 缓存每日/每周学习报告
- 减少数据库查询
- 提高报告加载速度

### 4. 单词学习状态缓存 ⭐⭐⭐⭐
- 缓存用户的单词学习状态
- 快速获取待复习单词列表
- 实时更新学习进度

### 5. 排行榜数据 ⭐⭐⭐
- 缓存用户排行榜
- 实现快速排序和筛选
- 支持实时更新

### 6. 限流和防护 ⭐⭐⭐
- API 请求限流
- 防止恶意请求
- 控制资源访问频率

## 注意事项

### 1. 数据一致性

- Redis 作为缓存层，需要考虑数据更新时同步 Redis
- 使用适当的缓存失效策略，避免脏数据
- 对于关键数据，考虑使用数据库事务保证一致性

### 2. 内存管理

- 合理设置缓存过期时间，避免内存占用过高
- 定期清理无用缓存
- 监控 Redis 内存使用情况

### 3. 持久化策略

- 根据业务需求选择合适的持久化策略（RDB 或 AOF）
- 定期备份 Redis 数据
- 考虑使用主从复制提高可用性

### 4. 安全性

- 生产环境务必设置 Redis 密码
- 不要将 Redis 暴露在公网
- 定期更新 Redis 版本

### 5. 性能优化

- 使用连接池管理 Redis 连接
- 批量操作时使用管道（Pipeline）
- 合理使用数据结构，选择最适合的类型

### 6. 监控和日志

- 监控 Redis 性能指标（内存使用、连接数、命令执行时间等）
- 记录关键操作的日志
- 设置告警机制，及时发现异常

## 故障排查

### 问题 1: 无法连接到 Redis

**解决方案：**
1. 检查 Redis 服务是否启动
2. 检查防火墙设置
3. 验证 Redis 配置是否正确
4. 检查网络连接

### 问题 2: 内存不足

**解决方案：**
1. 调整 `maxmemory` 配置
2. 设置合适的内存淘汰策略
3. 减少缓存数据量
4. 缩短缓存过期时间

### 问题 3: 性能下降

**解决方案：**
1. 检查慢查询日志
2. 优化数据结构
3. 使用管道批量操作
4. 考虑使用 Redis 集群

## 参考资料

- [Redis 官方文档](https://redis.io/documentation)
- [Redis 命令参考](https://redis.io/commands)
- [Node.js Redis 客户端](https://github.com/redis/node-redis)
- [connect-redis 文档](https://github.com/tj/connect-redis)

## 支持

如有问题或建议，请联系项目维护者。
