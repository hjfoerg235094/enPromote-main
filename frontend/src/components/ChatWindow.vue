
<template>
  <div class="chat-window">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="header-info">
        <img :src="getAvatarUrl(friendId)" :alt="displayName" class="header-avatar" />
        <div class="header-text">
          <span class="chat-title">{{ displayName }}</span>
          <span v-if="friend?.showOnlineStatus !== false" class="online-status" :class="onlineStatus">
            {{ onlineStatus === 'online' ? '在线' : '离线' }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button class="header-btn" @click="showMoreActions = !showMoreActions" title="更多操作">
          <span>⋯</span>
        </button>
        <button class="header-btn close-btn" @click="$emit('close')" title="关闭">×</button>
      </div>
    </div>

    <!-- 更多操作菜单 -->
    <div v-if="showMoreActions" class="more-actions-menu">
      <button @click="clearHistory">清空聊天记录</button>
      <button @click="viewProfile">查看资料</button>
    </div>

    <!-- 消息列表 -->
    <div ref="messageContainer" class="message-container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty">
        <div class="empty-icon">💬</div>
        <p>开始与 {{ displayName }} 聊天吧</p>
      </div>

      <div v-else class="messages">
        <ChatMessage
          v-for="message in messages"
          :key="message._id"
          :message="message"
          @copy="handleCopyMessage"
          @recall="handleRecallMessage"
        />
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <textarea
        v-model="inputMessage"
        class="message-input"
        placeholder="输入消息..."
        rows="3"
        @keydown.enter.prevent="handleEnter"
        :disabled="sending"
      ></textarea>
      <div class="input-actions">
        <span class="char-count">{{ inputMessage.length }}/1000</span>
        <button 
          class="send-btn" 
          @click="sendMessage"
          :disabled="!inputMessage.trim() || sending"
        >
          {{ sending ? '发送中...' : '发送' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { user } from '@/stores/userStore'
import ChatMessage from './ChatMessage_debug.vue'

interface Props {
  friendId: string
  friend?: {
    username: string
    remark: string
    showOnlineStatus?: boolean
  }
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const chatStore = useChatStore()

const inputMessage = ref('')
const messageContainer = ref<HTMLElement>()
const showMoreActions = ref(false)

// 处理复制消息
const handleCopyMessage = (message: any) => {
  navigator.clipboard.writeText(message.content)
  console.log('消息已复制:', message.content)
}

// 处理撤回消息
const handleRecallMessage = (message: any) => {
  console.log('撤回消息:', message)
  // TODO: 实现撤回消息的逻辑
}

// 计算属性：显示名称
const displayName = computed(() => {
  return props.friend?.remark || props.friend?.username || '未知用户'
})

// 计算属性：在线状态
const onlineStatus = computed(() => {
  return 'online' // 这里可以根据实际需求扩展
})

// 计算属性：消息列表
const messages = computed(() => {
  return chatStore.messages.get(props.friendId) || []
})

// 计算属性：加载状态
const loading = computed(() => chatStore.loading)

// 计算属性：发送状态
const sending = computed(() => chatStore.sending)

// 获取头像URL
const getAvatarUrl = (userId: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
}

// 监听friendId变化，加载消息
watch(() => props.friendId, async (newId) => {
  if (newId) {
    await chatStore.fetchMessages(newId)
    scrollToBottom()
  }
}, { immediate: true })

// 组件挂载时加载消息
onMounted(async () => {
  if (props.friendId) {
    await chatStore.fetchMessages(props.friendId)
    scrollToBottom()
  }
})

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 处理回车键
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    // Shift+Enter 换行
    return
  }
  // Enter 发送消息
  sendMessage()
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || sending.value) return

  try {
    await chatStore.sendMessage(props.friendId, inputMessage.value.trim())
    inputMessage.value = ''
    await scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.online-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4CAF50;
}

.close-btn {
  border: none;
  background: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0 8px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.loading,
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.messages {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.input-area {
  padding: 16px;
  border-top: 1px solid #e8e8e8;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #1890ff;
}

.message-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.send-btn {
  padding: 8px 24px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.send-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}
</style>
