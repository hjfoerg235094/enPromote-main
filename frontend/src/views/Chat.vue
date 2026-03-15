
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
})
</script>

<style scoped>
.chat-page {
  height: calc(100vh - 80px);
  padding: 20px;
  background: #f5f5f5;
}

.chat-container {
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  overflow: hidden;
}

.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.no-chat-selected p {
  font-size: 16px;
  margin: 0;
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
    display: flex;
  }

  .chat-main {
    display: none;
  }

  .chat-main.active {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
}
</style>
