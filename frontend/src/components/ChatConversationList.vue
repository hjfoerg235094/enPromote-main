
<template>
  <div class="conversation-list">
    <div class="list-header">
      <h3>消息列表</h3>
      <span v-if="totalUnreadCount > 0" class="unread-badge">{{ totalUnreadCount }}</span>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="conversations.length === 0" class="empty">
      暂无消息
    </div>

    <div v-else class="conversation-items">
      <div 
        v-for="conv in conversations" 
        :key="conv.conversationId"
        class="conversation-item"
        :class="{ active: activeConversationId === conv.conversationId }"
        @click="selectConversation(conv)"
      >
        <div class="conversation-avatar">
          <img :src="getAvatarUrl(conv.friendId)" :alt="conv.username" />
          <span v-if="conv.unreadCount > 0" class="unread-dot">{{ conv.unreadCount }}</span>
        </div>
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="conversation-name">{{ displayName(conv) }}</span>
            <span class="conversation-time">{{ formatTime(conv.lastMessageTime) }}</span>
          </div>
          <div class="conversation-preview">
            {{ conv.lastMessage?.content || '暂无消息' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'

interface Conversation {
  conversationId: string
  friendId: string
  username: string
  remark: string
  lastMessage: any
  lastMessageTime: Date
  unreadCount: number
}

interface Props {
  activeConversationId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['select'])

const chatStore = useChatStore()

const { conversations, loading, totalUnreadCount } = chatStore

// 显示名称（优先显示备注）
const displayName = (conv: Conversation) => {
  return conv.remark || conv.username
}

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

  // 如果是昨天的消息
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }

  // 否则显示日期
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// 获取头像URL
const getAvatarUrl = (userId: string) => {
  return `/default-avatar.png`
}

// 选择会话
const selectConversation = (conv: Conversation) => {
  emit('select', conv)
}
</script>

<style scoped>
.conversation-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.unread-badge {
  background: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.loading,
.empty {
  padding: 32px;
  text-align: center;
  color: #999;
}

.conversation-items {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.conversation-item.active {
  background: #e6f7ff;
}

.conversation-avatar {
  position: relative;
  flex-shrink: 0;
}

.conversation-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.unread-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4d4f;
  color: white;
  font-size: 12px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.conversation-preview {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
