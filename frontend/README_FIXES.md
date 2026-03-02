# 项目问题修复说明

## 修复的问题

### 1. 循环请求 /api/auth/info 问题

**问题描述：**
- 前端不断请求 `/api/auth/info` 接口，但一直收到 401 未授权错误
- 这导致页面性能下降，用户体验不佳

**根本原因：**
- App.vue 和 home.vue 在页面加载时都会调用 `getUserInfo()`
- 当用户未登录时，后端返回 401 错误
- 前端的响应拦截器在收到 401 错误后，会尝试跳转到登录页面
- 但由于某些原因，跳转没有成功，导致继续请求 `/api/auth/info`，形成无限循环

**解决方案：**
1. 修改了 `request.ts` 中的响应拦截器：
   - 添加了检查当前路径的逻辑，防止在登录/注册页面时再次跳转
   - 使用可选链操作符安全地访问 `error.response.data.redirect`
   - 提供默认值 `/login`，防止跳转地址为空

2. 修改了后端 `auth.js` 中的 `/info` 路由：
   - 将 400 状态码改为 401
   - 添加了 `redirect` 字段，确保前端能正确跳转

3. 在 App.vue 和 home.vue 中添加了路径检查：
   - 避免在登录/注册页面调用 `getUserInfo()`
   - 静默处理错误，不影响页面其他功能

### 2. 用户状态管理优化

**问题描述：**
- 多个组件都在调用 `getUserInfo()`，导致重复请求
- 没有统一的用户状态管理，代码难以维护

**解决方案：**
1. 创建了全局用户状态管理 `stores/userStore.ts`：
   - 统一管理用户信息
   - 避免重复请求
   - 提供 `isLoggedIn`、`username` 等计算属性
   - 提供 `clearUserInfo()`、`updateUserInfo()` 等方法

2. 更新了以下组件，使用新的用户状态管理：
   - App.vue
   - home.vue
   - header.vue

### 3. Session 认证优化

**问题描述：**
- 前端请求时没有正确发送 session cookie
- 导致后端无法识别用户登录状态

**解决方案：**
1. 在 `request.ts` 的请求拦截器中添加了 `withCredentials: true`
2. 在 `vite.config.ts` 的代理配置中添加了 `ws: true`

### 4. 路由守卫优化

**问题描述：**
- 没有全局的路由守卫来处理认证逻辑
- 每个需要认证的页面都要单独处理

**解决方案：**
1. 在 `router.ts` 中添加了全局前置路由守卫：
   - 统一处理需要认证的路由
   - 检查当前路径，避免在登录/注册页面时重复检查

## 使用说明

### 启动项目

1. 启动后端服务：
```bash
cd server
npm install
npm start
```

2. 启动前端服务：
```bash
cd frontend
npm install
npm run dev
```

### 使用用户状态管理

在组件中使用用户状态管理：

```typescript
import { getUserInfo, isLoggedIn, username as storeUsername, clearUserInfo } from '@/stores/userStore'

// 获取用户信息（会自动缓存，避免重复请求）
const userInfo = await getUserInfo()

// 检查是否已登录
if (isLoggedIn.value) {
  console.log('用户名:', storeUsername.value)
}

// 清除用户信息（退出登录时调用）
clearUserInfo()
```

### 注意事项

1. 确保后端服务在 `http://localhost:3000` 上运行
2. 确保 MongoDB 数据库已启动
3. 确保前端代理配置正确
4. 使用新的用户状态管理，避免直接调用 `getUserInfo()` API

## 后续优化建议

1. 考虑使用 Pinia 或 Vuex 进行更完善的状态管理
2. 添加请求取消机制，避免组件卸载后仍有请求在进行
3. 添加请求防抖，避免短时间内重复请求
4. 添加更完善的错误处理和用户提示
