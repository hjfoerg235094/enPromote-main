import { ref, computed } from 'vue'
import { getUserInfo as fetchUserInfo } from '@/api/auth'

interface UserInfo {
  _id:string
  username: string
  creatTime: string
  avatar: string
  cet4: {
    position: string
    lastStudyTime: string
    learnedWords: number
    todayStudiedWords: number
    streakDays: number
    lastStudyDate: string
  }
  todayWords: number
  streakDays: number
  totalWords: number
  planStudyWords: number
  planReviweWords: number
  question_completed: boolean
  ai_choose_completed: boolean
  chapters: {
    [key: string]: {
      level: number
      score: number
      completedWords: number
      wordP: boolean
      spellP: boolean
      listenP: boolean
      customsP: boolean
      coverP: boolean
    }
  }
  currentChapter: string
}

// 全局用户状态
const user = ref<UserInfo | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 计算属性：是否已登录
const isLoggedIn = computed(() => !!user.value)

// 计算属性：用户名
const username = computed(() => user.value?.username || '')

// 计算属性：头像URL
const avatarUrl = computed(() => {
  if (!user.value?.avatar || user.value.avatar === '/default-avatar.png') {
    // 使用在线默认头像
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  }
  // 如果是完整URL，直接使用
  if (user.value.avatar.startsWith('http')) {
    return user.value.avatar
  }
  // 确保路径以/avatars开头
  if (!user.value.avatar.startsWith('/avatars/')) {
    return '/avatars/' + user.value.avatar.replace(/^\/+/, '')
  }
  return user.value.avatar
})

// 获取用户信息
async function getUserInfo(forceRefresh = false) {
  // 如果已经加载过用户信息，且不是强制刷新，则直接返回
  if (user.value && !forceRefresh) {
    return user.value
  }

  // 检查当前路径，避免在登录/注册页面调用
  const currentPath = window.location.pathname
  if (currentPath === '/login' || currentPath === '/register') {
    return null
  }

  try {
    isLoading.value = true
    error.value = null
    const res = await fetchUserInfo()

    if (res.data && res.data.code === 200) {
      // 后端返回的用户信息直接在res.data中，而不是res.data.data中
      // 从res.data中提取用户信息字段
      const { code, message, ...userData } = res.data
      user.value = userData as UserInfo
      return user.value
    } else {
      error.value = res.data?.message || '获取用户信息失败'
      return null
    }
  } catch (err: any) {
    // 如果是 401 错误，说明用户未登录，这是正常情况，不设置错误
    if (err.response?.status === 401) {
      user.value = null
      return null
    }
    error.value = err.message || '获取用户信息失败'
    console.error('获取用户信息失败:', err)
    return null
  } finally {
    isLoading.value = false
  }
}

// 清除用户信息
function clearUserInfo() {
  user.value = null
  error.value = null
}

// 更新用户信息
function updateUserInfo(partialUser: Partial<UserInfo>) {
  if (user.value) {
    user.value = { ...user.value, ...partialUser }
  }
}

export {
  user,
  isLoading,
  error,
  isLoggedIn,
  username,
  avatarUrl,
  getUserInfo,
  clearUserInfo,
  updateUserInfo
}
