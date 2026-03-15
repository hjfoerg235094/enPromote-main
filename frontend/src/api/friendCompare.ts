import request from '@/utils/request'

/**
 * 获取学习进度对比
 */
export const getFriendCompare = (friendId: string) => {
  return request({
    url: `/friends/compare/${friendId}`,
    method: 'get'
  })
}
