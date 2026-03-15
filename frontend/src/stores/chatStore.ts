
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as chatApi from '@/api/chat'
import { user } from './userStore'

export interface Message {
  _id: string
  fromUserId: string
  toUserId: string
  content: string
  messageType: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
}

export interface Conversation {
  conversationId: string
  friendId: string
  username: string
  remark: string
  lastMessage: Message
  lastMessageTime: Date
  unreadCount: number
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const messages = ref<Map<string, Message[]>>(new Map())
  const loading = ref(false)
  const sending = ref(false)

  // 计算属性：总未读数
  const totalUnreadCount = computed(() => {
    return conversations.value.reduce((sum, conv) => sum + conv.unreadCount, 0)
  })

  /**
   * 获取会话列表
   */
  const fetchConversations = async () => {
    loading.value = true
    try {
      const res = await chatApi.getConversations()
      if (res.data.code === 200) {
        conversations.value = res.data.data
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取与指定好友的聊天记录
   */
  const fetchMessages = async (friendId: string, params?: { page?: number, limit?: number }) => {
    loading.value = true
    try {
      const res = await chatApi.getChatMessages(friendId, params)
      if (res.data.code === 200) {
        const newMessages = res.data.data.messages
        const existingMessages = messages.value.get(friendId) || []

        // 合并消息，避免重复
        const messageMap = new Map()
        existingMessages.forEach((msg: Message) => messageMap.set(msg._id, msg))
        newMessages.forEach((msg: Message) => messageMap.set(msg._id, msg))


        messages.value.set(friendId, Array.from(messageMap.values()).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ))

        return res.data.data
      }
    } catch (error) {
      console.error('获取聊天记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 发送消息
   */
  const sendMessage = async (toUserId: string, content: string, messageType = 'text') => {
    sending.value = true
    try {
      const res = await chatApi.sendMessage({ toUserId, content, messageType })
      if (res.data.code === 200) {
        // 创建临时消息对象
        const tempMessage: Message = {
          _id: res.data.data.messageId,
          fromUserId: user.value?._id || '',
          toUserId,
          content,
          messageType,
          isRead: false,
          createdAt: new Date(res.data.data.createdAt)
        }

        // 添加到消息列表
        const existingMessages = messages.value.get(toUserId) || []
        messages.value.set(toUserId, [...existingMessages, tempMessage])

        // 更新会话列表
        await fetchConversations()

        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    } finally {
      sending.value = false
    }
  }

  /**
   * 标记消息为已读
   */
  const markConversationAsRead = async (conversationId: string) => {
    try {
      const res = await chatApi.markAsRead(conversationId)
      if (res.data.code === 200) {
        // 更新会话未读数
        const conversation = conversations.value.find(c => c.conversationId === conversationId)
        if (conversation) {
          conversation.unreadCount = 0
        }
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('标记已读失败:', error)
      throw error
    }
  }

  /**
   * 删除会话
   */
  const deleteConversation = async (conversationId: string) => {
    try {
      const res = await chatApi.deleteConversation(conversationId)
      if (res.data.code === 200) {
        // 从会话列表中移除
        conversations.value = conversations.value.filter(c => c.conversationId !== conversationId)
        return { success: true }
      }
      return { success: false }
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  /**
   * 清空指定好友的消息缓存
   */
  const clearMessages = (friendId: string) => {
    messages.value.delete(friendId)
  }

  return {
    conversations,
    messages,
    loading,
    sending,
    totalUnreadCount,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markConversationAsRead,
    deleteConversation,
    clearMessages
  }
})
