<template>
  <div class="friend-card">
    <div class="friend-avatar">
      <img :src="avatarUrl" :alt="friend.username" />
      <span v-if="friend.showOnlineStatus" class="status-indicator" :class="onlineStatus"></span>
    </div>
    <div class="friend-info">
      <h3>{{ displayName }}</h3>
      <p v-if="friend.remark" class="username">@{{ friend.username }}</p>
      <p class="join-date">加入时间: {{ formatDate(friend.joinDate) }}</p>
    </div>
    <div class="friend-actions">
      <button class="btn-icon" @click="$emit('view-progress', friend.id)" title="查看进度">
        <span>📊</span>
      </button>
      <button class="btn-icon" @click="$emit('view-profile', friend.id)" title="查看资料">
        <span>👤</span>
      </button>
      <button class="btn-icon" @click="$emit('edit-remark', friend)" title="设置备注">
        <span>✏️</span>
      </button>
      <button class="btn-icon danger" @click="$emit('delete', friend)" title="删除好友">
        <span>🗑️</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  friend: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view-progress', 'view-profile', 'edit-remark', 'delete'])

// 计算显示名称（优先显示备注）
const displayName = computed(() => {
  return props.friend.remark || props.friend.username
})

// 计算头像URL
const avatarUrl = computed(() => {
  return '/default-avatar.png'
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 在线状态（这里可以根据实际需求扩展）
const onlineStatus = computed(() => {
  return 'online' // 默认在线，实际应该从API获取
})
</script>

<style scoped>
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
</style>
