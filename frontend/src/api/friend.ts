import request from '@/utils/request'

/**
 * 搜索用户
 */
export const searchUser = (username: string) => {
  return request({
    url: '/friends/search',
    method: 'get',
    params: { username }
  })
}

/**
 * 发送好友请求
 */
export const sendFriendRequest = (data: { toUserId: string, message?: string }) => {
  return request({
    url: '/friends/request',
    method: 'post',
    data
  })
}

/**
 * 接受好友请求
 */
export const acceptFriendRequest = (requestId: string) => {
  return request({
    url: '/friends/accept',
    method: 'post',
    data: { requestId }
  })
}

/**
 * 拒绝好友请求
 */
export const rejectFriendRequest = (requestId: string) => {
  return request({
    url: '/friends/reject',
    method: 'post',
    data: { requestId }
  })
}

/**
 * 获取好友列表
 */
export const getFriends = (params?: { page?: number, limit?: number, sort?: string }) => {
  return request({
    url: '/friends/list',
    method: 'get',
    params
  })
}

/**
 * 获取好友请求列表
 */
export const getFriendRequests = () => {
  return request({
    url: '/friends/requests',
    method: 'get'
  })
}

/**
 * 删除好友
 */
export const deleteFriend = (friendId: string) => {
  return request({
    url: `/friends/${friendId}`,
    method: 'delete'
  })
}

/**
 * 屏蔽好友
 */
export const blockFriend = (friendId: string) => {
  return request({
    url: `/friends/${friendId}/block`,
    method: 'post'
  })
}

/**
 * 设置好友备注
 */
export const setFriendRemark = (friendId: string, remark: string) => {
  return request({
    url: '/friends/remark',
    method: 'post',
    data: { friendId, remark }
  })
}

/**
 * 获取好友词汇量排行榜
 */
export const getFriendRanking = (type: 'totalWords' | 'todayWords' | 'streakDays' = 'totalWords') => {
  return request({
    url: '/friends/ranking',
    method: 'get',
    params: { type }
  })
}
