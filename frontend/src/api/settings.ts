import request from '@/utils/request'

/**
 * 获取用户设置
 */
export const getUserSettings = () => {
  return request({
    url: '/settings',
    method: 'get'
  })
}

/**
 * 更新用户设置
 */
export const updateUserSettings = (data: any) => {
  return request({
    url: '/settings',
    method: 'put',
    data
  })
}
