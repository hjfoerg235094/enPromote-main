<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="chat-sidebar">
        <ChatConversationList
          :active-conversation-id="activeConversationId"
          @select="handleSelectConversation"
        />
      </div>

      <!-- 右侧聊天窗口 -->
      <div class="chat-main">
        <div v-if="!selectedFriend" class="no-chat-selected">
          <div class="empty-icon">💬</div>
          <p>选择一个会话开始聊天</p>
        </div>
        <ChatWindow
          v-else
          :friend-id="selectedFriend.friendId"
          :friend="selectedFriend"
          @close="handleCloseChat"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import ChatConversationList from '@/components/ChatConversationList.vue'
import ChatWindow from '@/components/ChatWindow.vue'

interface Conversation {
  conversationId: string
  friendId: string
  username: string
  remark: string
  lastMessage: any
  lastMessageTime: Date
  unreadCount: number
}

const route = useRoute()
const chatStore = useChatStore()
const activeConversationId = ref<string>('')
const selectedFriend = ref<Conversation | null>(null)

// 选择会话
const handleSelectConversation = (conv: Conversation) => {
  activeConversationId.value = conv.conversationId
  selectedFriend.value = conv

  // 标记为已读
  if (conv.unreadCount > 0) {
    chatStore.markConversationAsRead(conv.conversationId)
  }
}

// 关闭聊天
const handleCloseChat = () => {
  selectedFriend.value = null
  activeConversationId.value = ''
}

// 组件挂载时加载会话列表
onMounted(async () => {
  try {
    // 强制刷新会话列表
    await chatStore.fetchConversations()

    // 检查URL参数，如果有friendId则直接打开聊天
    const { friendId, friendName } = route.query
    if (friendId) {
      // 查找或创建临时会话对象
      const conversation = chatStore.conversations.find(c => c.friendId === friendId)
      if (conversation) {
        handleSelectConversation(conversation)
      } else {
        // 如果没有现有会话，创建临时会话对象
        selectedFriend.value = {
          conversationId: `temp-${friendId}`,
          friendId: friendId as string,
          username: friendName as string || '未知用户',
          remark: friendName as string || '',
          lastMessage: null,
          lastMessageTime: new Date(),
          unreadCount: 0
        }
      }
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
})
</script>

<style scoped>
.chat-page {
  height: calc(100vh - 80px);
  padding: 20px;
}

.chat-container {
  display: flex;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}

.chat-main {
  flex: 1;
  overflow: hidden;
}

.no-chat-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
  }

  .chat-main {
    display: none;
  }

  .chat-main.active {
    display: block;
    width: 100%;
  }
}
</style>
