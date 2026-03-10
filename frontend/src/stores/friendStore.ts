import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as friendApi from '@/api/friend'

export const useFriendStore = defineStore('friend', () => {
  const friends = ref([])
  const requests = ref([])
  const loading = ref(false)
  const searchResults = ref([])
  const searchLoading = ref(false)

  // 计算属性：是否有待处理的好友请求
  const hasPendingRequests = computed(() => {
    return requests.value.length > 0
  })

  // 计算属性：好友总数
  const friendsCount = computed(() => {
    return friends.value.length
  })

  /**
   * 获取好友列表
   */
  const fetchFriends = async (params?: { page?: number, limit?: number, sort?: string }) => {
    loading.value = true
    try {
      const res = await friendApi.getFriends(params)
      if (res.data.code === 200) {
        friends.value = res.data.data.list
        return res.data.data
      }
    } catch (error) {
      console.error('获取好友列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取好友请求列表
   */
  const fetchRequests = async () => {
    try {
      const res = await friendApi.getFriendRequests()
      if (res.data.code === 200) {
        requests.value = res.data.data
      }
    } catch (error) {
      console.error('获取好友请求列表失败:', error)
      throw error
    }
  }

  /**
   * 搜索用户
   */
  const searchUser = async (username: string) => {
    searchLoading.value = true
    try {
      const res = await friendApi.searchUser(username)
      if (res.data.code === 200) {
        searchResults.value = res.data.data
        return res.data.data
      }
      return []
    } catch (error) {
      console.error('搜索用户失败:', error)
      throw error
    } finally {
      searchLoading.value = false
    }
  }

  /**
   * 发送好友请求
   */
  const sendRequest = async (toUserId: string, message?: string) => {
    try {
      const res = await friendApi.sendFriendRequest({ toUserId, message })
      if (res.data.code === 200) {
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('发送好友请求失败:', error)
      throw error
    }
  }

  /**
   * 接受好友请求
   */
  const acceptRequest = async (requestId: string) => {
    try {
      const res = await friendApi.acceptFriendRequest(requestId)
      if (res.data.code === 200) {
        // 从请求列表中移除
        requests.value = requests.value.filter(r => r.id !== requestId)
        // 刷新好友列表
        await fetchFriends()
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('接受好友请求失败:', error)
      throw error
    }
  }

  /**
   * 拒绝好友请求
   */
  const rejectRequest = async (requestId: string) => {
    try {
      const res = await friendApi.rejectFriendRequest(requestId)
      if (res.data.code === 200) {
        // 从请求列表中移除
        requests.value = requests.value.filter(r => r.id !== requestId)
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('拒绝好友请求失败:', error)
      throw error
    }
  }

  /**
   * 删除好友
   */
  const deleteFriend = async (friendId: string) => {
    try {
      const res = await friendApi.deleteFriend(friendId)
      if (res.data.code === 200) {
        // 从好友列表中移除
        friends.value = friends.value.filter(f => f.id !== friendId)
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('删除好友失败:', error)
      throw error
    }
  }

  /**
   * 屏蔽好友
   */
  const blockFriend = async (friendId: string) => {
    try {
      const res = await friendApi.blockFriend(friendId)
      if (res.data.code === 200) {
        // 从好友列表中移除
        friends.value = friends.value.filter(f => f.id !== friendId)
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('屏蔽好友失败:', error)
      throw error
    }
  }

  /**
   * 设置好友备注
   */
  const setRemark = async (friendId: string, remark: string) => {
    try {
      const res = await friendApi.setFriendRemark(friendId, remark)
      if (res.data.code === 200) {
        // 更新好友列表中的备注
        const friend = friends.value.find(f => f.id === friendId)
        if (friend) {
          friend.remark = remark
        }
        return { success: true, message: res.data.message }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      console.error('设置好友备注失败:', error)
      throw error
    }
  }

  return {
    friends,
    requests,
    loading,
    searchResults,
    searchLoading,
    hasPendingRequests,
    friendsCount,
    fetchFriends,
    fetchRequests,
    searchUser,
    sendRequest,
    acceptRequest,
    rejectRequest,
    deleteFriend,
    blockFriend,
    setRemark
  }
})
