
<template>
  <div class="adventure-story-container">
    <div class="story-header">
      <h1 class="page-title">闯关/剧情</h1>
      <p class="page-subtitle">沉浸式场景学习，在剧情中提升英语能力</p>
    </div>

    <!-- 学习进度概览 -->
    <div class="progress-overview">
      <div class="progress-card">
        <div class="progress-icon">📖</div>
        <div class="progress-info">
          <div class="progress-value">{{ completedChapters }}/{{ totalChapters }}</div>
          <div class="progress-label">已完成章节</div>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">🎯</div>
        <div class="progress-info">
          <div class="progress-value">{{ completedTasks }}/{{ totalTasks }}</div>
          <div class="progress-label">已完成任务</div>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">⏱️</div>
        <div class="progress-info">
          <div class="progress-value">{{ formatTime(totalStudyTime) }}</div>
          <div class="progress-label">学习时长</div>
        </div>
      </div>
    </div>

    <!-- 剧情模式选择 -->
    <div class="story-modes">
      <h2 class="section-title">选择学习模式</h2>

      <!-- 剧情模式卡片 -->
      <div class="mode-card" @click="goToStoryMode">
        <div class="mode-icon">🎭</div>
        <div class="mode-content">
          <h3>剧情模式</h3>
          <p>跟随剧情发展，完成各种任务，在故事中学习英语</p>
          <div class="mode-features">
            <span class="feature-tag">📚 丰富剧情</span>
            <span class="feature-tag">🎯 多样任务</span>
            <span class="feature-tag">🏆 成就系统</span>
          </div>
        </div>
        <div class="mode-arrow">→</div>
      </div>

      <!-- 闯关模式卡片 -->
      <div class="mode-card" @click="goToAdventureMode">
        <div class="mode-icon">🗺️</div>
        <div class="mode-content">
          <h3>闯关模式</h3>
          <p>系统化闯关学习，从基础到进阶，逐步提升英语能力</p>
          <div class="mode-features">
            <span class="feature-tag">📊 进度追踪</span>
            <span class="feature-tag">🎯 目标明确</span>
            <span class="feature-tag">📈 能力提升</span>
          </div>
        </div>
        <div class="mode-arrow">→</div>
      </div>
    </div>

    <!-- 当前进度 -->
    <div class="current-progress" v-if="currentChapter">
      <h2 class="section-title">当前进度</h2>
      <div class="progress-card detailed">
        <div class="chapter-info">
          <div class="chapter-icon">📖</div>
          <div class="chapter-details">
            <h3>{{ currentChapter.title }}</h3>
            <p>{{ currentChapter.description }}</p>
            <div class="chapter-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: chapterProgress + '%' }"></div>
              </div>
              <span class="progress-text">{{ chapterProgressText }}</span>
            </div>
          </div>
        </div>
        <button class="continue-button" @click="continueChapter">继续学习</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 响应式数据
const completedChapters = ref(0)
const totalChapters = ref(5)
const completedTasks = ref(0)
const totalTasks = ref(25)
const totalStudyTime = ref(0) // 以分钟为单位
const currentChapter = ref(null)

// 计算属性
const chapterProgress = computed(() => {
  if (!currentChapter.value || !currentChapter.value.tasks) return 0
  const completed = currentChapter.value.tasks.filter(task => task.completed).length
  return Math.round((completed / currentChapter.value.tasks.length) * 100)
})

const chapterProgressText = computed(() => {
  if (!currentChapter.value || !currentChapter.value.tasks) return '0/0'
  const completed = currentChapter.value.tasks.filter(task => task.completed).length
  return `${completed}/${currentChapter.value.tasks.length}`
})

// 方法
const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

const goToStoryMode = () => {
  router.push('/story')
}

const goToAdventureMode = () => {
  router.push('/chapters')
}

const continueChapter = () => {
  if (currentChapter.value) {
    router.push(`/chapter/${currentChapter.value.storyId}/${currentChapter.value.chapterId}`)
  }
}

// 获取用户进度数据
const fetchProgressData = async () => {
  try {
    // 获取用户学习进度
    const progressRes = await axios.get('/api/user/progress')
    if (progressRes.data && progressRes.data.code === 200) {
      const data = progressRes.data.data
      completedChapters.value = data.completedChapters || 0
      completedTasks.value = data.completedTasks || 0
      totalStudyTime.value = data.totalStudyTime || 0
      currentChapter.value = data.currentChapter || null
    }
  } catch (error) {
    console.error('获取进度数据失败:', error)
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchProgressData()
})
</script>

<style scoped>
.adventure-story-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.story-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin: 0 0 10px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.progress-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-card.detailed {
  flex-direction: column;
  align-items: stretch;
}

.progress-icon {
  font-size: 32px;
}

.progress-info {
  display: flex;
  flex-direction: column;
}

.progress-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.story-modes {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.mode-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.mode-icon {
  font-size: 48px;
  margin-right: 20px;
}

.mode-content {
  flex: 1;
}

.mode-content h3 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.mode-content p {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.mode-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  padding: 4px 12px;
  border-radius: 16px;
  background: #f0f0f0;
  font-size: 12px;
  color: #666;
}

.mode-arrow {
  font-size: 24px;
  color: #999;
}

.current-progress {
  margin-bottom: 30px;
}

.chapter-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.chapter-icon {
  font-size: 48px;
}

.chapter-details {
  flex: 1;
}

.chapter-details h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.chapter-details p {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
}

.chapter-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  min-width: 40px;
}

.continue-button {
  width: 100%;
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}
</style>
