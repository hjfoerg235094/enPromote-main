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

    <!-- 好友列表 -->
    <div class="friends-section">
      <div v-if="loading" class="loading">
        加载中...
      </div>
      <div v-else-if="friends.length === 0" class="empty">
        <div class="empty-icon">👥</div>
        <p>还没有好友</p>
        <button class="btn-primary" @click="showAddFriendModal = true">添加好友</button>
      </div>
      <div v-else class="friends-grid">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="friend-card"
        >
          <div class="friend-avatar">
            <img :src="getAvatarUrl(friend.id)" :alt="friend.username" />
            <span v-if="friend.showOnlineStatus" class="status-indicator online"></span>
          </div>
          <div class="friend-info">
            <h3>{{ friend.remark || friend.username }}</h3>
            <p v-if="friend.remark" class="username">@{{ friend.username }}</p>
            <p class="join-date">加入时间: {{ formatDate(friend.joinDate) }}</p>
          </div>
          <div class="friend-actions">
            <button class="btn-icon" @click="viewProfile(friend.id)" title="查看资料">
              <span>👤</span>
            </button>
            <button class="btn-icon" @click="editRemark(friend)" title="设置备注">
              <span>✏️</span>
            </button>
            <button class="btn-icon danger" @click="confirmDelete(friend)" title="删除好友">
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
              v-model="searchQuery"
              type="text"
              placeholder="输入用户名搜索"
              @keyup.enter="handleSearch"
            />
            <button
              class="btn-primary"
              @click="handleSearch"
              :disabled="searchLoading || !searchQuery"
            >
              {{ searchLoading ? '搜索中...' : '搜索' }}
            </button>
          </div>
          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="user in searchResults"
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
import { ref, computed, onMounted } from 'vue'
import { useFriendStore } from '@/stores/friendStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const friendStore = useFriendStore()

const showAddFriendModal = ref(false)
const showRequestsModal = ref(false)
const showRemarkModal = ref(false)
const searchQuery = ref('')
const remarkText = ref('')
const currentFriend = ref(null)

const { friends, requests, loading, hasPendingRequests, searchResults, searchLoading } = friendStore

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
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return

  try {
    await friendStore.searchUser(searchQuery.value)
  } catch (error) {
    console.error('搜索失败:', error)
    alert('搜索失败，请稍后重试')
  }
}

// 发送好友请求
const sendRequest = async (userId) => {
  try {
    const result = await friendStore.sendRequest(userId)
    if (result.success) {
      alert(result.message)
      showAddFriendModal.value = false
      searchQuery.value = ''
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
  await friendStore.fetchFriends()
  await friendStore.fetchRequests()
})
</script>

<style scoped>
.friends-page {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
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
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.friend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.friend-avatar {
  position: relative;
  flex-shrink: 0;
}

.friend-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.online {
  background: #4CAF50;
}

.status-indicator.offline {
  background: #999;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-info .username {
  margin: 0 0 5px 0;
  color: #999;
  font-size: 12px;
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
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 4px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-icon:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.btn-icon.danger:hover {
  background: #ffebee;
  color: #f44336;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
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
