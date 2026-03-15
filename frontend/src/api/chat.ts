
import request from '@/utils/request'

/**
 * 获取与指定好友的聊天记录
 */
export const getChatMessages = (friendId: string, params?: { page?: number, limit?: number }) => {
  return request({
    url: `/chat/messages/${friendId}`,
    method: 'get',
    params
  })
}

/**
 * 发送消息
 */
export const sendMessage = (data: { toUserId: string, content: string, messageType?: string }) => {
  return request({
    url: '/chat/send',
    method: 'post',
    data
  })
}

/**
 * 获取会话列表
 */
export const getConversations = () => {
  return request({
    url: '/chat/conversations',
    method: 'get'
  })
}

/**
 * 标记消息为已读
 */
export const markAsRead = (conversationId: string) => {
  return request({
    url: `/chat/read/${conversationId}`,
    method: 'post'
  })
}

/**
 * 删除会话
 */
export const deleteConversation = (conversationId: string) => {
  return request({
    url: `/chat/conversation/${conversationId}`,
    method: 'delete'
  })
}
