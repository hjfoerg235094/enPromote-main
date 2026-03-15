<template>
  <div class="friends-page">
    <div class="page-header">
      <h1>好友管理</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="showAddFriendModal = true">
          <span class="icon">+</span> 添加好友
        </button>
        <button
          v-if="hasPendingRequests"
          class="btn-secondary"
          @click="showRequestsModal = true"
        >
          <span class="badge">{{ requests.length }}</span>
          好友请求
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="search-filter-bar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索好友..."
        />
        <span class="search-icon">🔍</span>
      </div>
      <div class="filter-options">
        <select v-model="filterStatus" @change="applyFilters">
          <option value="all">全部状态</option>
          <option value="online">在线</option>
          <option value="offline">离线</option>
        </select>
        <select v-model="sortBy" @change="applyFilters">
          <option value="recent">最近联系</option>
          <option value="name">名称排序</option>
          <option value="date">添加时间</option>
        </select>
        <button
          v-if="selectedFriends.length > 0"
          class="btn-batch"
          @click="showBatchActions = !showBatchActions"
        >
          批量操作 ({{ selectedFriends.length }})
        </button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="showBatchActions" class="batch-actions-bar">
      <button class="btn-secondary" @click="batchChat">批量聊天</button>
      <button class="btn-secondary" @click="batchDelete">批量删除</button>
      <button class="btn-secondary" @click="clearSelection">取消选择</button>
    </div>

    <!-- 好友列表 -->
    <div class="friends-section">
      <div v-if="friendStore.loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="filteredFriends.length === 0" class="empty">
        <div class="empty-icon">👥</div>
        <p>{{ searchQuery ? '未找到匹配的好友' : '还没有好友' }}</p>
        <button v-if="!searchQuery" class="btn-primary" @click="showAddFriendModal = true">添加好友</button>
      </div>
      <div v-else class="friends-grid">
        <div
          v-for="friend in filteredFriends"
          :key="friend.id"
          class="friend-card"
          :class="{ selected: selectedFriends.includes(friend.id) }"
          @click="handleCardClick(friend, $event)"
        >
          <div class="friend-checkbox" v-if="showBatchActions || selectedFriends.length > 0">
            <input type="checkbox" :checked="selectedFriends.includes(friend.id)" @click.stop="toggleSelection(friend.id)" />
          </div>
          <div class="friend-avatar">
            <img :src="getAvatarUrl(friend.id)" :alt="friend.username" />
            <span class="status-indicator" :class="friend.showOnlineStatus ? 'online' : 'offline'"></span>
          </div>
          <div class="friend-info">
            <h3>{{ friend.remark || friend.username }}</h3>
            <p v-if="friend.remark" class="username">@{{ friend.username }}</p>
            <p class="join-date">加入时间: {{ formatDate(friend.joinDate) }}</p>
          </div>
          <div class="friend-actions">
            <button class="btn-icon" @click.stop="startChat(friend)" title="开始聊天">
              <span>💬</span>
            </button>
            <button class="btn-icon" @click.stop="viewProfile(friend.id)" title="查看资料">
              <span>👤</span>
            </button>
            <button class="btn-icon" @click.stop="editRemark(friend)" title="设置备注">
              <span>✏️</span>
            </button>
            <button class="btn-icon danger" @click.stop="confirmDelete(friend)" title="删除好友">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加好友弹窗 -->
    <div v-if="showAddFriendModal" class="modal-overlay" @click="showAddFriendModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>添加好友</h2>
          <button class="btn-close" @click="showAddFriendModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="search-box">
            <input
              v-model="addFriendSearchQuery"
              type="text"
              placeholder="输入用户名搜索"
              @keyup.enter="handleSearchUser"
            />
            <button
              class="btn-primary"
              @click="handleSearchUser"
              :disabled="friendStore.searchLoading || !addFriendSearchQuery"
            >
              {{ friendStore.searchLoading ? '搜索中...' : '搜索' }}
            </button>
          </div>
          <div v-if="friendStore.searchResults.length > 0" class="search-results">
            <div
              v-for="user in friendStore.searchResults"
              :key="user.id"
              class="search-result-item"
            >
              <div class="user-info">
                <img :src="getAvatarUrl(user.id)" :alt="user.username" />
                <div>
                  <h4>{{ user.username }}</h4>
                  <p>加入时间: {{ formatDate(user.joinDate) }}</p>
                </div>
              </div>
              <button
                v-if="!user.isFriend"
                class="btn-primary"
                @click="sendRequest(user.id)"
              >
                添加
              </button>
              <span v-else class="already-friend">已是好友</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 好友请求弹窗 -->
    <div v-if="showRequestsModal" class="modal-overlay" @click="showRequestsModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>好友请求</h2>
          <button class="btn-close" @click="showRequestsModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="requests.length === 0" class="empty">
            <p>暂无待处理的好友请求</p>
          </div>
          <div v-else class="requests-list">
            <div
              v-for="request in requests"
              :key="request.id"
              class="request-item"
            >
              <div class="request-info">
                <img :src="getAvatarUrl(request.fromUserId)" :alt="request.username" />
                <div>
                  <h4>{{ request.username }}</h4>
                  <p v-if="request.message">"{{ request.message }}"</p>
                  <p class="request-time">{{ formatDate(request.createTime) }}</p>
                </div>
              </div>
              <div class="request-actions">
                <button
                  class="btn-primary"
                  @click="handleAccept(request.id)"
                >
                  接受
                </button>
                <button
                  class="btn-secondary"
                  @click="handleReject(request.id)"
                >
                  拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置备注弹窗 -->
    <div v-if="showRemarkModal" class="modal-overlay" @click="showRemarkModal = false">
      <div class="modal small" @click.stop>
        <div class="modal-header">
          <h2>设置备注</h2>
          <button class="btn-close" @click="showRemarkModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>备注名称</label>
            <input
              v-model="remarkText"
              type="text"
              placeholder="输入备注名称"
              maxlength="20"
            />
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showRemarkModal = false">取消</button>
            <button class="btn-primary" @click="handleSaveRemark">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFriendStore } from '@/stores/friendStore'
import { useRouter } from 'vue-router'

// 防抖函数
function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

const router = useRouter()
const friendStore = useFriendStore()

const showAddFriendModal = ref(false)
const showRequestsModal = ref(false)
const showRemarkModal = ref(false)
const showBatchActions = ref(false)
const searchQuery = ref('')
const addFriendSearchQuery = ref('')
const remarkText = ref('')
const currentFriend = ref(null)
const selectedFriends = ref([])
const filterStatus = ref('all')
const sortBy = ref('recent')

const { requests, loading, hasPendingRequests, searchLoading } = friendStore

// 计算属性：过滤后的好友列表
const filteredFriends = computed(() => {
  console.log('friendStore.friends:', friendStore.friends)
  // 添加空值检查
  const friendsList = friendStore.friends || []
  console.log('friendsList:', friendsList)
  if (!Array.isArray(friendsList)) {
    return []
  }

  let result = [...friendsList]
  console.log('filteredFriends result:', result)

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(friend => 
      (friend.remark && friend.remark.toLowerCase().includes(query)) ||
      friend.username.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (filterStatus.value !== 'all') {
    result = result.filter(friend => 
      filterStatus.value === 'online' ? friend.showOnlineStatus : !friend.showOnlineStatus
    )
  }

  // 排序
  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => {
        const nameA = (a.remark || a.username).toLowerCase()
        const nameB = (b.remark || b.username).toLowerCase()
        return nameA.localeCompare(nameB, 'zh-CN')
      })
      break
    case 'date':
      result.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
      break
    case 'recent':
    default:
      // 保持原顺序或根据最近联系时间排序
      break
  }

  return result
})

// 获取头像URL
const getAvatarUrl = (userId) => {
  return '/default-avatar.png'
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 搜索用户
const handleSearchUser = async () => {
  console.log('开始搜索用户:', addFriendSearchQuery.value)
  if (!addFriendSearchQuery.value.trim()) return

  try {
    const result = await friendStore.searchUser(addFriendSearchQuery.value)
    console.log('搜索结果:', result)
    console.log('friendStore.searchResults:', friendStore.searchResults)
  } catch (error) {
    console.error('搜索失败:', error)
    alert('搜索失败，请稍后重试')
  }
}

// 应用筛选
const applyFilters = () => {
  // 筛选逻辑在computed中自动应用
}

// 处理卡片点击
const handleCardClick = (friend, event) => {
  if (showBatchActions.value || selectedFriends.value.length > 0) {
    toggleSelection(friend.id)
  }
}

// 切换选择状态
const toggleSelection = (friendId) => {
  const index = selectedFriends.value.indexOf(friendId)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  } else {
    selectedFriends.value.push(friendId)
  }
}

// 清除选择
const clearSelection = () => {
  selectedFriends.value = []
  showBatchActions.value = false
}

// 批量聊天
const batchChat = () => {
  if (selectedFriends.value.length === 0) return
  // 打开第一个选中好友的聊天窗口
  const firstFriend = friends.value.find(f => f.id === selectedFriends.value[0])
  if (firstFriend) {
    startChat(firstFriend)
    clearSelection()
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedFriends.value.length === 0) return
  if (!confirm(`确定要删除选中的 ${selectedFriends.value.length} 位好友吗？`)) return

  try {
    for (const friendId of selectedFriends.value) {
      await friendStore.deleteFriend(friendId)
    }
    clearSelection()
    alert('批量删除成功')
  } catch (error) {
    console.error('批量删除失败:', error)
    alert('批量删除失败，请稍后重试')
  }
}

// 发送好友请求
const sendRequest = async (userId) => {
  try {
    const result = await friendStore.sendRequest(userId)
    if (result.success) {
      alert(result.message)
      showAddFriendModal.value = false
      addFriendSearchQuery.value = ''
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error('发送请求失败:', error)
    alert('发送请求失败，请稍后重试')
  }
}

// 接受好友请求
const handleAccept = async (requestId) => {
  try {
    const result = await friendStore.acceptRequest(requestId)
    if (result.success) {
      alert(result.message)
      if (requests.length === 0) {
        showRequestsModal.value = false
      }
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error('接受请求失败:', error)
    alert('接受请求失败，请稍后重试')
  }
}

// 拒绝好友请求
const handleReject = async (requestId) => {
  try {
    const result = await friendStore.rejectRequest(requestId)
    if (result.success) {
      alert(result.message)
      if (requests.length === 0) {
        showRequestsModal.value = false
      }
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error('拒绝请求失败:', error)
    alert('拒绝请求失败，请稍后重试')
  }
}

// 查看好友资料
const viewProfile = (friendId) => {
  router.push(`/profile/${friendId}`)
}

// 开始聊天
const startChat = (friend) => {
  router.push({
    path: '/chat',
    query: {
      friendId: friend.id,
      friendName: friend.remark || friend.username
    }
  })
}

// 编辑备注
const editRemark = (friend) => {
  currentFriend.value = friend
  remarkText.value = friend.remark || ''
  showRemarkModal.value = true
}

// 保存备注
const handleSaveRemark = async () => {
  if (!currentFriend.value) return

  try {
    const result = await friendStore.setRemark(currentFriend.value.id, remarkText.value)
    if (result.success) {
      alert(result.message)
      showRemarkModal.value = false
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error('保存备注失败:', error)
    alert('保存备注失败，请稍后重试')
  }
}

// 确认删除好友
const confirmDelete = (friend) => {
  if (confirm(`确定要删除好友 "${friend.remark || friend.username}" 吗？`)) {
    deleteFriend(friend.id)
  }
}

// 删除好友
const deleteFriend = async (friendId) => {
  try {
    const result = await friendStore.deleteFriend(friendId)
    if (result.success) {
      alert(result.message)
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error('删除好友失败:', error)
    alert('删除好友失败，请稍后重试')
  }
}

// 组件挂载时获取好友列表和请求
onMounted(async () => {
  try {
    // 先加载好友列表，强制刷新
    await friendStore.fetchFriends(undefined, true)
    // 延迟加载好友请求，避免同时请求
    setTimeout(() => {
      friendStore.fetchRequests(true)
    }, 200)
  } catch (error) {
    console.error('加载好友列表失败:', error)
    alert('加载好友列表失败，请刷新页面重试')
  }
})
</script>

<style scoped>
.friends-page {
  max-width: 1400px;
  margin: 20px auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 搜索和筛选栏 */
.search-filter-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
  pointer-events: none;
}

.filter-options {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-options select {
  padding: 10px 32px 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: all 0.3s;
}

.filter-options select:focus {
  outline: none;
  border-color: #1890ff;
}

.btn-batch {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-batch:hover {
  background: #40a9ff;
}

/* 批量操作栏 */
.batch-actions-bar {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  background: #ff4444;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  margin-right: 5px;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.friend-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.friend-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.friend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.friend-card:hover::before {
  opacity: 1;
}

.friend-card.selected {
  border: 2px solid #1890ff;
  background: #e6f7ff;
}

.friend-checkbox {
  flex-shrink: 0;
  margin-right: 8px;
}

.friend-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #1890ff;
}

.friend-avatar {
  position: relative;
  flex-shrink: 0;
}

.friend-avatar img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
  transition: border-color 0.3s;
}

.friend-card:hover .friend-avatar img {
  border-color: #1890ff;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-indicator.online {
  background: #52c41a;
  animation: pulse 2s ease-in-out infinite;
}

.status-indicator.offline {
  background: #d9d9d9;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-info h3 {
  margin: 0 0 6px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-info .username {
  margin: 0 0 6px 0;
  color: #999;
  font-size: 13px;
}

.friend-info .join-date {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.friend-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-icon:hover {
  background: #e6f7ff;
  color: #1890ff;
  transform: scale(1.1);
}

.btn-icon.danger:hover {
  background: #fff1f0;
  color: #ff4d4f;
}

.empty {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-box input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item .user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-result-item .user-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.search-result-item .user-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.search-result-item .user-info p {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.already-friend {
  color: #999;
  font-size: 14px;
}

.requests-list {
  max-height: 400px;
  overflow-y: auto;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.request-item:last-child {
  border-bottom: none;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.request-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.request-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.request-info p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 12px;
}

.request-time {
  color: #999;
  font-size: 12px;
}

.request-actions {
  display: flex;
  gap: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
