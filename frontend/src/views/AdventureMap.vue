<template>
  <div class="adventure-map-container">
    <!-- 顶部导航 -->
    <div class="map-header">
      <button class="back-btn" @click="goBack">
        <i class="icon-arrow-left"></i>
        返回章节选择
      </button>
      <div class="chapter-info">
        <h1>{{ currentChapterInfo.name }}</h1>
        <p>{{ currentChapterInfo.description }}</p>
      </div>
    </div>

    <!-- 纵向滚动关卡地图 -->
    <div class="scrollable-map" ref="mapContainer">
      <div class="map-content">
        <!-- 历史完成的关卡 (向上滚动查看) -->
        <div v-if="historyLevels.length > 0" class="history-section">
          <div class="history-hint">
            <i class="icon-arrow-up"></i>
            <span>向上滑动查看历史</span>
          </div>
          <div 
            v-for="(level, index) in historyLevels" 
            :key="`history-${level.chapter}-${level.type}`"
            class="level-node completed"
            @click="viewLevelDetails(level)"
          >
            <div class="level-icon">{{ getLevelIcon(level.type) }}</div>
            <div class="level-content">
              <h3>{{ getLevelName(level.type) }}</h3>
              <p class="level-chapter">{{ getChapterName(level.chapter) }}</p>
              <div class="completion-badge">✓ 已完成</div>
            </div>
          </div>
          <div class="chapter-divider completed">
            <span>{{ getChapterName(historyLevels[historyLevels.length - 1]?.chapter) }} 已完成</span>
          </div>
        </div>

        <!-- 当前章节的关卡 -->
        <div class="current-chapter-section">
          <div 
            v-for="(level, index) in currentChapterLevels" 
            :key="`current-${level.type}`"
            class="level-node"
            :class="getLevelNodeClass(level, index)"
            @click="handleLevelClick(level, index)"
          >
            <div class="level-icon">{{ getLevelIcon(level.type) }}</div>
            <div class="level-content">
              <h3>{{ getLevelName(level.type) }}</h3>
              <p class="level-description">{{ getLevelDescription(level.type) }}</p>
              <div class="level-status">
                <span v-if="level.completed" class="status-completed">✓ 已完成</span>
                <span v-else-if="level.current" class="status-current">● 当前关卡</span>
                <span v-else class="status-locked">🔒 未解锁</span>
              </div>
            </div>
            <div v-if="level.current" class="current-indicator">
              <div class="pulse-ring"></div>
            </div>
          </div>
        </div>

        <!-- 未解锁章节预览 -->
        <div v-if="nextChapterPreview" class="next-chapter-section">
          <div class="chapter-divider locked">
            <span>{{ nextChapterPreview.name }}</span>
            <small>完成当前章节解锁</small>
          </div>
          <div class="level-node preview">
            <div class="level-icon">{{ getLevelIcon('word') }}</div>
            <div class="level-content">
              <h3>{{ getLevelName('word') }}</h3>
              <p class="level-description">{{ nextChapterPreview.description }}</p>
              <div class="level-status">
                <span class="status-preview">🔒 未解锁</span>
              </div>
            </div>
          </div>
          <div class="hidden-levels-hint">
            <span>？？？</span>
            <small>更多关卡待解锁</small>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="bottom-hint">
          <i class="icon-arrow-down"></i>
          <span>向下滑动查看更多</span>
        </div>
      </div>
    </div>

    <!-- 进度统计 -->
    <div class="progress-panel">
      <div class="progress-item">
        <span class="progress-label">当前章节</span>
        <span class="progress-value">{{ currentChapter }}</span>
      </div>
      <div class="progress-item">
        <span class="progress-label">完成进度</span>
        <span class="progress-value">{{ completedLevels }}/{{ totalLevels }}</span>
      </div>
      <div class="progress-item">
        <span class="progress-label">总体进度</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo } from '@/api/auth'

const router = useRouter()
const mapContainer = ref(null)
const userInfo = ref(null)
const currentChapter = ref('A')

// 章节配置
const chapterConfig = {
  A: {
    name: '酒店场景',
    description: '学习酒店入住、退房等相关英语',
    scenario: 'hotel'
  },
  B: {
    name: '餐厅场景',
    description: '学习餐厅点餐、用餐等相关英语',
    scenario: 'restaurant'
  },
  C: {
    name: '机场场景',
    description: '学习机场办理手续等相关英语',
    scenario: 'airport'
  }
}

// 关卡配置
const levelConfig = {
  word: { name: '单词学习', icon: '📚', description: '学习新单词，掌握基础词汇' },
  spell: { name: '拼写练习', icon: '✏️', description: '练习单词拼写，加强记忆' },
  listen: { name: '听力练习', icon: '🎧', description: '提升听力理解能力' },
  customs: { name: '情景对话', icon: '💬', description: '模拟真实场景对话' },
  cover: { name: 'AI实战', icon: '🤖', description: '与AI进行实战对话练习' }
}

// 计算属性
const currentChapterInfo = computed(() => {
  return chapterConfig[currentChapter.value] || chapterConfig.A
})

const currentChapterLevels = computed(() => {
  if (!userInfo.value?.chapters?.[currentChapter.value]) return []
  
  const chapter = userInfo.value.chapters[currentChapter.value]
  const levels = ['word', 'spell', 'listen', 'customs', 'cover']
  
  return levels.map((type, index) => {
    const fieldName = type + 'P'
    const completed = chapter[fieldName] || false
    const current = !completed && (index === 0 || levels.slice(0, index).every(t => chapter[t + 'P']))
    
    return {
      type,
      completed,
      current,
      locked: !completed && !current
    }
  })
})

const historyLevels = computed(() => {
  // 获取已完成章节的所有关卡
  const history = []
  if (!userInfo.value?.chapters) return history
  
  const chapters = Object.keys(userInfo.value.chapters).sort()
  const currentIndex = chapters.indexOf(currentChapter.value)
  
  for (let i = 0; i < currentIndex; i++) {
    const chapterKey = chapters[i]
    const chapter = userInfo.value.chapters[chapterKey]
    const levels = ['cover', 'customs', 'listen', 'spell', 'word'] // 倒序显示
    
    levels.forEach(type => {
      if (chapter[type + 'P']) {
        history.push({
          chapter: chapterKey,
          type,
          completed: true
        })
      }
    })
  }
  
  return history
})

const nextChapterPreview = computed(() => {
  const chapters = ['A', 'B', 'C']
  const currentIndex = chapters.indexOf(currentChapter.value)
  const nextChapter = chapters[currentIndex + 1]
  
  if (!nextChapter) return null
  
  return chapterConfig[nextChapter]
})

const completedLevels = computed(() => {
  return currentChapterLevels.value.filter(level => level.completed).length
})

const totalLevels = computed(() => {
  return currentChapterLevels.value.length
})

const overallProgress = computed(() => {
  if (totalLevels.value === 0) return 0
  return Math.round((completedLevels.value / totalLevels.value) * 100)
})

// 方法
const getLevelIcon = (type) => {
  return levelConfig[type]?.icon || '❓'
}

const getLevelName = (type) => {
  return levelConfig[type]?.name || '未知关卡'
}

const getLevelDescription = (type) => {
  return levelConfig[type]?.description || ''
}

const getChapterName = (chapterKey) => {
  return chapterConfig[chapterKey]?.name || '未知章节'
}

const getLevelNodeClass = (level, index) => {
  const classes = []
  if (level.completed) classes.push('completed')
  if (level.current) classes.push('current')
  if (level.locked) classes.push('locked')
  return classes
}

const handleLevelClick = (level, index) => {
  if (level.locked) {
    // 显示提示：需要完成前面的关卡
    return
  }
  
  if (level.completed) {
    // 可以重新挑战
    enterLevel(level.type)
  } else if (level.current) {
    // 进入当前关卡
    enterLevel(level.type)
  }
}

const enterLevel = (levelType) => {
  // 跳转到 adventure.vue 页面，并传递关卡类型参数
  router.push({
    path: '/adventure',
    query: {
      level: levelType,
      chapter: currentChapter.value
    }
  })
}

const viewLevelDetails = (level) => {
  // 查看历史关卡详情
  console.log('查看关卡详情:', level)
}

const goBack = () => {
  router.push('/chapters')
}

const scrollToCurrentLevel = () => {
  nextTick(() => {
    const currentLevelElement = mapContainer.value?.querySelector('.level-node.current')
    if (currentLevelElement) {
      currentLevelElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  })
}

const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo()
    console.log('用户信息API响应:', response) // 调试日志
    
    // axios 响应数据在 response.data 中
    const data = response.data || response
    
    if (data.code === 200) {
      userInfo.value = data
      currentChapter.value = data.currentChapter || 'A'
      scrollToCurrentLevel()
    } else {
      console.error('获取用户信息失败:', data.message || '未知错误')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.adventure-map-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  flex-direction: column;
}

.map-header {
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 2rem;
  color: white;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chapter-info h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.chapter-info p {
  margin: 0.25rem 0 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.scrollable-map {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.map-content {
  max-width: 600px;
  margin: 0 auto;
}

.history-section, .current-chapter-section, .next-chapter-section {
  margin-bottom: 2rem;
}

.history-hint, .bottom-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.level-node {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  color: white;
}

.level-node:hover {
  transform: translateX(10px);
  background: rgba(255, 255, 255, 0.15);
}

.level-node.completed {
  background: rgba(76, 175, 80, 0.3);
  border: 2px solid rgba(76, 175, 80, 0.5);
}

.level-node.current {
  background: rgba(255, 193, 7, 0.3);
  border: 2px solid rgba(255, 193, 7, 0.8);
  box-shadow: 0 0 20px rgba(255, 193, 7, 0.3);
}

.level-node.locked {
  background: rgba(255, 255, 255, 0.05);
  opacity: 0.6;
  cursor: not-allowed;
}

.level-node.preview {
  background: rgba(255, 255, 255, 0.05);
  opacity: 0.4;
  cursor: not-allowed;
}

.level-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
}

.level-content {
  flex: 1;
}

.level-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.level-description, .level-chapter {
  margin: 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.level-status {
  margin-top: 0.5rem;
}

.status-completed {
  color: #4CAF50;
  font-weight: 600;
}

.status-current {
  color: #FFD700;
  font-weight: 600;
}

.status-locked, .status-preview {
  color: rgba(255, 255, 255, 0.6);
}

.current-indicator {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.pulse-ring {
  width: 20px;
  height: 20px;
  border: 2px solid #FFD700;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.chapter-divider {
  text-align: center;
  padding: 1rem;
  margin: 2rem 0;
  position: relative;
}

.chapter-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
}

.chapter-divider span {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  position: relative;
  z-index: 1;
  color: white;
}

.chapter-divider.completed span {
  background: rgba(76, 175, 80, 0.3);
  color: #4CAF50;
}

.chapter-divider.locked span {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.hidden-levels-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 1rem;
}

.hidden-levels-hint span {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.progress-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.progress-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.progress-value {
  font-weight: 600;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .map-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .scrollable-map {
    padding: 1rem;
  }
  
  .level-node {
    padding: 1rem;
  }
  
  .progress-panel {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>