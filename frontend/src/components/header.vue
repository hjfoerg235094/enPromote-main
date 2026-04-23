    <!-- 页面头部 -->
    <template>
      <header class="header">
        <div class="logo">
          <h1>EnglishMastery</h1>
        </div>
        <nav class="main-nav">
          <ul>
            <li><router-link to="/" class="active">首页</router-link></li>
            <li><router-link to="/daily-study">今日学习</router-link></li>
            <li><router-link to="/adventure-story">闯关/剧情</router-link></li>
            <li><router-link to="/review-ai-chat">复盘/AI对话</router-link></li>
            <li><router-link to="/friends">好友</router-link></li>
          </ul>
        </nav>
        <div class="user-actions">
          <router-link to="/login" class="btn-login" v-if="!isLoggedIn">登录</router-link>
          <router-link to="/register" class="btn-register" v-if="!isLoggedIn">注册</router-link>
          <div class="user-profile" v-if="isLoggedIn" ref="dropdownRef">
            <div class="avatar-container" @click="toggleDropdown">
              <img :src="userAvatar" alt="用户头像" class="avatar" />
              <span class="username">{{ storeUsername }}</span>
            </div>
            <div class="dropdown-menu" v-show="showDropdown">
              <router-link to="/profile" class="dropdown-item">个人主页</router-link>
              <div class="dropdown-divider"></div>
              <button @click="Logout" class="dropdown-item">退出登录</button>
            </div>
          </div>
        </div>
      </header>
    </template>

<script setup>
import '@/assets/css/home_head.css'
import '@/assets/css/header.css'
import { ref, computed } from 'vue'
import { logout } from '@/api/auth'
import { getUserInfo, isLoggedIn, username as storeUsername, clearUserInfo, avatarUrl } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'

const router = useRouter()
const userAvatar = avatarUrl // 使用store中的头像URL
const showDropdown = ref(false)
const dropdownRef = ref(null) // 用于点击外部检测的ref

// 使用vueuse的onClickOutside功能
onClickOutside(dropdownRef, () => {
  showDropdown.value = false
})

// 点击头像切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 点击外部关闭下拉菜单
const closeDropdown = () => {
  showDropdown.value = false
}

// 点击外部关闭的处理已经由 onClickOutside 接管

// 初始化时获取用户信息
getUserInfo()

const Logout = async () => {
  try {
    await logout()
    clearUserInfo()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>