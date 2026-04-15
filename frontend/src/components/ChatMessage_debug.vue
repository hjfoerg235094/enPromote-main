<template>
  <div class="chat-message" :class="messageClass">
    <!-- 对方消息：头像在左 -->
    <div v-if="!isOwnMessage" class="message-avatar">
      <img :src="avatarUrl" :alt="message.fromUserName" />
    </div>

    <div class="message-content">
      <div class="message-text">{{ message.content }}</div>
      <div class="message-time">{{ formatTime(message.createdAt) }}</div>
    </div>

    <!-- 自己消息：头像在右 -->
    <div v-if="isOwnMessage" class="message-avatar">
      <img :src="avatarUrl" :alt="'我'" />
    </div>

    <div v-if="message.isRead && isOwnMessage" class="read-status">已读</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { user } from '@/stores/userStore'

interface Props {
  message: {
    _id: string
    fromUserId: string | { toString(): string }
    toUserId: string | { toString(): string }
    content: string
    messageType: string
    isRead: boolean
    readAt?: Date
    createdAt: Date
    fromUserName?: string
  }
}

const props = defineProps<Props>()

// 判断是否是自己的消息
const isOwnMessage = computed(() => {
  const fromUserId = props.message.fromUserId
  const currentUserId = (user.value as any)?._id

  if (typeof fromUserId === 'object' && fromUserId !== null) {
    const id = (fromUserId as any)?._id || fromUserId
    return String(id) === String(currentUserId)
  }
  return String(fromUserId) === String(currentUserId)
})

// 消息样式类
const messageClass = computed(() => {
  return {
    'own-message': isOwnMessage.value,
    'other-message': !isOwnMessage.value
  }
})

// 头像URL
const avatarUrl = computed(() => {
  if (isOwnMessage.value) {
    return (user.value as any)?.avatar || '/default-avatar.png'
  }
  // 对于好友消息，使用好友的头像
  const fromUserId = props.message.fromUserId
  if (typeof fromUserId === 'object' && fromUserId !== null) {
    return (fromUserId as any)?.avatar || '/default-avatar.png'
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUserId}`
})

// 格式化时间
const formatTime = (date: Date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()

  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
/* ========== 核心布局 ========== */
.chat-message {
  display: flex;
  align-items: flex-end;
  margin-bottom: 15px;
  padding: 0 20px;
  gap: 10px;
}

/* 自己的消息：靠右 */
.own-message {
  justify-content: flex-end;
}

/* 别人的消息：靠左 */
.other-message {
  justify-content: flex-start;
}

/* ========== 头像 ========== */
.message-avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.message-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ========== 内容区域 ========== */
.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ========== 消息气泡 ========== */
.message-text {
  padding: 10px 16px;
  border-radius: 18px;
  line-height: 1.5;
  font-size: 14px;
  color: #fff;
  position: relative;
  word-break: break-all;
}

/* --- 对方消息（紫色气泡，尖角朝左）--- */
.other-message .message-text {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  border-bottom-left-radius: 4px;
}
.other-message .message-text::after {
  content: '';
  position: absolute;
  left: -8px;
  bottom: 14px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #7c3aed;
}

/* --- 自己消息（粉色气泡，尖角朝右）--- */
.own-message .message-text {
  background: linear-gradient(135deg, #ff6b9d 0%, #f43f5e 100%);
  border-bottom-right-radius: 4px;
}
.own-message .message-text::after {
  content: '';
  position: absolute;
  right: -8px;
  bottom: 14px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid #f43f5e;
}

/* ========== 时间戳 ========== */
.message-time {
  font-size: 12px;
  color: #999;
}
.own-message .message-time {
  text-align: right;
}
.other-message .message-time {
  text-align: left;
}

/* ========== 已读状态 ========== */
.read-status {
  font-size: 12px;
  color: #999;
  margin-bottom: 2px;
  align-self: flex-end;
}

/* ========== 入场动画 ========== */
.chat-message {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .message-content {
    max-width: 80%;
  }
  .message-avatar {
    width: 38px;
    height: 38px;
  }
  .message-text {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>