
<template>
  <div class="chat-message" :class="messageClass">
    <div class="message-avatar">
      <img :src="avatarUrl" :alt="isOwnMessage ? '我' : message.fromUserName" />
    </div>
    <div class="message-content">
      <div class="message-text">{{ message.content }}</div>
      <div class="message-time">{{ formatTime(message.createdAt) }}</div>
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
  
  // 处理ObjectId和String类型的比较
  if (typeof fromUserId === 'object' && fromUserId !== null) {
    // 如果fromUserId是对象，可能包含_id字段
    const id = (fromUserId as any)?._id || fromUserId
    return String(id) === String(currentUserId)
  }
  return String(fromUserId) === String(currentUserId)
})

// 消息样式类
const messageClass = computed(() => ({
  'own-message': isOwnMessage.value,
  'other-message': !isOwnMessage.value
}))

// 头像URL
const avatarUrl = computed(() => {
  if (isOwnMessage.value) {
    return (user.value as any)?.avatar || '/default-avatar.png'
  }
  return '/default-avatar.png'
})

// 格式化时间
const formatTime = (date: Date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  // 如果是今天的消息，只显示时间
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 否则显示日期和时间
  return d.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<style scoped>
.chat-message {
  display: flex;
  align-items: flex-end;
  margin-bottom: 20px;
  padding: 0 16px;
  width: 100%;
}

.chat-message.own-message {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.chat-message.other-message {
  flex-direction: row;
  justify-content: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  margin: 0 8px;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e8e8e8;
}

.message-content {
  max-width: 60%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
}

/* 对方消息的气泡样式 */
.other-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-left-radius: 4px;
}

.other-message .message-text::before {
  content: '';
  position: absolute;
  left: -8px;
  bottom: 12px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #764ba2;
}

/* 自己消息的气泡样式 */
.own-message .message-text {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.own-message .message-text::before {
  content: '';
  position: absolute;
  right: -8px;
  bottom: 12px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid #f5576c;
}

.message-time {
  font-size: 11px;
  color: #999;
  padding: 0 4px;
}

.own-message .message-time {
  text-align: right;
}

.other-message .message-time {
  text-align: left;
}

.read-status {
  align-self: flex-end;
  font-size: 11px;
  color: #999;
  margin-left: 8px;
  margin-bottom: 2px;
}

@media (max-width: 768px) {
  .message-content {
    max-width: 75%;
  }
  
  .message-avatar {
    width: 36px;
    height: 36px;
  }
}
</style>
