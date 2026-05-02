<template>
  <header class="app-header">
    <router-link to="/" class="brand" aria-label="EnglishMastery 首页">
      <!-- <span class="brand-mark">E</span> -->
      <span class="brand-copy">
        <strong>EnglishMastery</strong>
        <!-- <small>轻闯关英语训练</small> -->
      </span>
    </router-link>

    <button class="nav-toggle" type="button" @click="showMobileNav = !showMobileNav">
      {{ showMobileNav ? '关闭' : '菜单' }}
    </button>

    <nav class="main-nav" :class="{ open: showMobileNav }">
      <router-link to="/daily-study">今日任务</router-link>
      <router-link to="/adventure-story">闯关学习</router-link>
      <router-link to="/review-ai-chat">学习报告</router-link>
      <router-link to="/aiChatExer">AI 口语</router-link>
      <router-link to="/friends">好友</router-link>
    </nav>

    <div class="user-actions">
      <template v-if="!isLoggedIn">
        <router-link to="/login" class="auth-link">登录</router-link>
        <router-link to="/register" class="auth-link primary">注册</router-link>
      </template>

      <div class="user-profile" v-else ref="dropdownRef">
        <button class="avatar-button" type="button" @click="toggleDropdown">
          <img :src="userAvatar" alt="用户头像" class="avatar" />
          <span class="username">{{ storeUsername || '我的' }}</span>
        </button>
        <div class="dropdown-menu" v-show="showDropdown">
          <router-link to="/profile" class="dropdown-item" @click="closeDropdown">个人主页</router-link>
          <button type="button" @click="Logout" class="dropdown-item danger">退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { logout } from '@/api/auth'
import { getUserInfo, isLoggedIn, username as storeUsername, clearUserInfo, avatarUrl } from '@/stores/userStore'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'

const router = useRouter()
const userAvatar = avatarUrl
const showDropdown = ref(false)
const showMobileNav = ref(false)
const dropdownRef = ref(null)

onClickOutside(dropdownRef, () => {
  showDropdown.value = false
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

getUserInfo()

const Logout = async () => {
  try {
    await logout()
  } finally {
    clearUserInfo()
    showDropdown.value = false
    router.push('/login')
  }
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 12px max(20px, 5vw);
  border-bottom: 1px solid rgba(36, 49, 47, 0.1);
  background: rgba(255, 253, 247, 0.9);
  backdrop-filter: blur(16px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--learn-ink);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: var(--learn-primary);
  color: #fff;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(31, 138, 112, 0.2);
}

.brand-copy {
  display: grid;
  line-height: 1.15;
}

.brand-copy strong {
  font-size: 17px;
}

.brand-copy small {
  color: var(--learn-muted);
  font-size: 12px;
}

.main-nav {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.main-nav a {
  padding: 9px 13px;
  border-radius: 999px;
  color: var(--learn-muted);
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  background: var(--learn-green-soft);
  color: var(--learn-primary-dark);
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.auth-link {
  padding: 9px 15px;
  border: 1px solid rgba(31, 138, 112, 0.2);
  border-radius: 999px;
  color: var(--learn-primary-dark);
  font-weight: 800;
  text-decoration: none;
}

.auth-link.primary {
  background: var(--learn-primary);
  color: #fff;
}

.user-profile {
  position: relative;
}

.avatar-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border-radius: 999px;
  background: #fff;
  color: var(--learn-ink);
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--learn-line);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  max-width: 96px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 150px;
  padding: 8px;
  border: 1px solid var(--learn-line);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--learn-shadow);
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: transparent;
  color: var(--learn-ink);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--learn-green-soft);
}

.dropdown-item.danger {
  color: var(--learn-coral);
}

.nav-toggle {
  display: none;
  justify-self: end;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--learn-amber-soft);
  color: var(--learn-ink);
  font-weight: 800;
}

@media (max-width: 920px) {
  .app-header {
    grid-template-columns: auto auto;
  }

  .nav-toggle {
    display: inline-flex;
  }

  .main-nav {
    display: none;
    grid-column: 1 / -1;
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-top: 6px;
  }

  .main-nav.open {
    display: flex;
  }

  .user-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
