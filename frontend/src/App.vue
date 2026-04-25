<template>
  <Header />
  <!-- 展示区路由组件放置处 -->
  <router-view></router-view>

  <!-- Toast 组件容器 -->
  <div id="toast-container"></div>

  <!-- Modal 组件容器 -->
  <div id="modal-container"></div>

  <!-- 问卷组件 -->
  <!-- <Question :show="showQuestionModal" @close="handleQuestionClose" @completed="handleQuestionCompleted" /> -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from './components/header.vue'
import Question from './components/question.vue'
import { getUserInfo, isLoggedIn, clearUserInfo } from '@/stores/userStore'
import { toast } from '@/utils/toastService'

// 响应式数据
const showQuestionModal = ref(false)

// 检查用户是否需要填写问卷
const checkQuestionStatus = async () => {
  try {
    const userInfo = await getUserInfo()
    if (userInfo && !userInfo.question_completed) {
      // 如果用户未完成问卷，显示问卷模态框
      showQuestionModal.value = true
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 处理问卷关闭
const handleQuestionClose = () => {
  showQuestionModal.value = false
}

// 处理问卷完成
const handleQuestionCompleted = (planData: { planStudyWords: number; planReviweWords: number }) => {
  console.log('用户学习计划设置完成:', planData)
  showQuestionModal.value = false

  // 可以在这里添加一些完成后的逻辑，比如显示欢迎消息
  // 或者跳转到特定页面
}

// 组件挂载时检查问卷状态
onMounted(() => {
  // 检查当前路径，避免在登录/注册页面调用
  const currentPath = window.location.pathname;
  if (currentPath === '/login' || currentPath === '/register') {
    return;
  }

  // 延迟检查，确保用户已登录
  setTimeout(() => {
    checkQuestionStatus()
  }, 1000)
})
</script>
<style scoped></style>