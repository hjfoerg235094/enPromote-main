<template>
  <div class="loading-modal-overlay" v-if="visible">
    <div class="loading-modal">
      <div class="loading-header">
        <div class="ai-avatar">🤖</div>
        <h2>AI正在为您生成专属题目</h2>
        <p class="subtitle">基于您的单词掌握情况，定制个性化练习</p>
      </div>

      <div class="loading-content">
        <div class="loading-animation">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="loading-text">
          <p class="current-message">{{ currentMessage }}</p>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <div class="loading-footer" v-if="isCompleted">
        <div class="success-icon">✨</div>
        <p class="success-text">题目生成完成！准备开始后续关卡</p>
        <button class="continue-btn" @click="handleContinue">
          继续闯关
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['continue', 'close'])

const currentMessage = ref('')
const progress = ref(0)
const isCompleted = ref(false)
let messageInterval = null
let progressInterval = null

// 加载提示语数组
const loadingMessages = [
  '正在分析您的词汇掌握情况...',
  'AI正在思考最适合您的题目类型...',
  '根据您的学习进度生成个性化内容...',
  '正在创建酒店场景对话练习...',
  '为您准备填空题和选择题...',
  '优化题目难度以匹配您的水平...',
  '最后的润色，确保题目质量...',
  '即将完成，请稍候...'
]

let currentMessageIndex = 0

const startLoading = () => {
  currentMessageIndex = 0
  progress.value = 0
  isCompleted.value = false
  currentMessage.value = loadingMessages[0]

  // 消息轮换
  messageInterval = setInterval(() => {
    currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length
    currentMessage.value = loadingMessages[currentMessageIndex]
  }, 5000)

  // 进度条动画
  progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 15 + 5 // 随机增长5-20%
    }
  }, 1500)
}

const completeLoading = () => {
  clearInterval(messageInterval)
  clearInterval(progressInterval)
  progress.value = 100
  isCompleted.value = true
  currentMessage.value = '题目生成完成！'
}

const handleContinue = () => {
  emit('continue')
}

// 监听visible变化
const { visible } = toRefs(props)
watch(visible, (newVal) => {
  if (newVal) {
    startLoading()
  } else {
    clearInterval(messageInterval)
    clearInterval(progressInterval)
  }
})

onUnmounted(() => {
  clearInterval(messageInterval)
  clearInterval(progressInterval)
})

// 暴露方法给父组件
defineExpose({
  completeLoading
})
</script>

<script>
import { toRefs, watch } from 'vue'
</script>

<style scoped>
.loading-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.loading-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.5s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.loading-header {
  margin-bottom: 2rem;
}

.ai-avatar {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-10px);
  }

  60% {
    transform: translateY(-5px);
  }
}

.loading-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.subtitle {
  opacity: 0.9;
  font-size: 1rem;
}

.loading-content {
  margin-bottom: 2rem;
}

.loading-animation {
  margin-bottom: 2rem;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: loadingDot 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loadingDot {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

.current-message {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  min-height: 1.5rem;
  opacity: 0.9;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.loading-footer {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: sparkle 1s ease-in-out;
}

@keyframes sparkle {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }
}

.success-text {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
}

.continue-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 1rem 2rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.continue-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-modal {
    padding: 2rem;
    margin: 1rem;
  }

  .ai-avatar {
    font-size: 3rem;
  }

  .loading-header h2 {
    font-size: 1.3rem;
  }
}
</style>
