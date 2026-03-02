<template>
  <div class="chapter-selection">
    <!-- 背景装饰元素 -->
    <div class="bg-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
      <div class="floating-shape shape-4"></div>
    </div>

    <div class="header">
      <div class="header-icon">🎓</div>
      <h1 class="header-title">
        <span class="title-main">英语学习之旅</span>
        <span class="title-sub">选择你的学习章节</span>
      </h1>
      <p class="header-description">
        <span class="highlight">个性化学习体验</span> • 每个章节都有独特的场景和词汇挑战
      </p>
    </div>

    <div class="chapters-container">
      <div v-for="chapter in chapters" :key="chapter.id" class="chapter-card"
        :style="{ background: chapter.backgroundColor }" @click="selectChapter(chapter.id)">
        <div class="chapter-content">
          <div class="chapter-header">
            <h2>{{ chapter.name }}</h2>
            <div class="chapter-progress">
              <span class="progress-text">{{ getChapterProgress(chapter.id) }}/5</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: (getChapterProgress(chapter.id) / 5) * 100 + '%' }"></div>
              </div>
            </div>
          </div>

          <p class="chapter-description">{{ chapter.description }}</p>

          <div class="chapter-stats">
            <div class="stat-item">
              <span class="stat-label">场景</span>
              <span class="stat-value">{{ chapter.scenario === 'hotel' ? '酒店' : '餐厅' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">词汇量</span>
              <span class="stat-value">{{ chapter.vocabulary?.length || 0 }}</span>
            </div>
          </div>

          <div class="chapter-levels">
            <div v-for="level in 5" :key="level" class="level-dot" :class="{
              'completed': isLevelCompleted(chapter.id, level),
              'current': isCurrentLevel(chapter.id, level)
            }">
              {{ level }}
            </div>
          </div>
        </div>

        <div class="chapter-overlay">
          <button class="select-btn">
            {{ currentChapter === chapter.id ? '继续学习' : '开始学习' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { switchChapter, getUserInfo } from '@/api/auth'

const router = useRouter()
const userInfo = ref(null)
const currentChapter = ref('A')

// 章节配置
const chapters = ref([
  {
    id: 'A',
    name: '酒店场景',
    description: '学习酒店入住、退房等相关英语',
    scenario: 'hotel',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    vocabulary: ['reception', 'check-in', 'check-out', 'reservation', 'lobby']
  },
  {
    id: 'B',
    name: '餐厅场景',
    description: '学习餐厅点餐、用餐等相关英语',
    scenario: 'restaurant',
    backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    vocabulary: ['menu', 'order', 'appetizer', 'main course', 'dessert']
  }
])

// 获取章节进度
const getChapterProgress = (chapterId) => {
  if (!userInfo.value?.chapters?.[chapterId]) return 0
  const chapter = userInfo.value.chapters[chapterId]
  let completed = 0
  if (chapter.wordP) completed++
  if (chapter.spellP) completed++
  if (chapter.listenP) completed++
  if (chapter.customsP) completed++
  if (chapter.coverP) completed++
  return completed
}

// 检查关卡是否完成
const isLevelCompleted = (chapterId, level) => {
  if (!userInfo.value?.chapters?.[chapterId]) return false
  const chapter = userInfo.value.chapters[chapterId]
  const levelKeys = ['wordP', 'spellP', 'listenP', 'customsP', 'coverP']
  return chapter[levelKeys[level - 1]] || false
}

// 检查是否为当前关卡
const isCurrentLevel = (chapterId, level) => {
  if (!userInfo.value?.chapters?.[chapterId]) return level === 1
  const chapter = userInfo.value.chapters[chapterId]
  return (chapter.level || 1) === level
}

// 选择章节
const selectChapter = async (chapterId) => {
  try {
    const response = await switchChapter(chapterId)
    console.log('API响应:', response) // 调试日志

    // axios 响应数据在 response.data 中
    const data = response.data || response

    if (data.code === 200) {
      currentChapter.value = chapterId
      // 跳转到冒险页面
      router.push('/adventure')
    } else {
      console.error('切换章节失败:', data.message || '未知错误')
    }
  } catch (error) {
    console.error('切换章节错误:', error)
    // 显示更友好的错误提示
    alert('切换章节失败，请检查网络连接或重新登录')
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo()
    console.log('用户信息API响应:', response) // 调试日志

    // axios 响应数据在 response.data 中
    const data = response.data || response

    if (data.code === 200) {
      userInfo.value = data
      currentChapter.value = data.currentChapter || 'A'
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
.chapter-selection {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* 背景装饰元素 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite linear;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: -5s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 80%;
  left: 20%;
  animation-delay: -10s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 30%;
  right: 30%;
  animation-delay: -15s;
}

@keyframes float {
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.3;
  }

  100% {
    transform: translateY(0px) rotate(360deg);
    opacity: 0.7;
  }
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 4rem;
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  padding: 3rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 4rem;
}

.header-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: inline-block;
  animation: bounce 2s infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
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

.header-title {
  margin-bottom: 1.5rem;
}

.title-main {
  display: block;
  font-size: 3.2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff, #f0f0f0, #ffffff);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}

.title-sub {
  display: block;
  font-size: 1.4rem;
  font-weight: 400;
  opacity: 0.95;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

.header-description {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.highlight {
  background: linear-gradient(45deg, #FFD700, #FFA500);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
  text-shadow: none;
}

.chapters-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 2.5rem;
  max-width: 1200px;
  width: 100%;
  position: relative;
  z-index: 2;
}

.chapter-card {
  position: relative;
  border-radius: 24px;
  padding: 2.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  min-height: 320px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.chapter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  opacity: 0.9;
  z-index: -1;
}

.chapter-card:hover {
  transform: translateY(-15px) scale(1.02);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.4);
}

.chapter-card:hover .chapter-overlay {
  opacity: 1;
}

.chapter-content {
  position: relative;
  z-index: 2;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.chapter-header h2 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.chapter-progress {
  text-align: right;
}

.progress-text {
  font-size: 1rem;
  opacity: 0.95;
  display: block;
  margin-bottom: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.progress-bar {
  width: 90px;
  height: 8px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.chapter-description {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.chapter-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.chapter-levels {
  display: flex;
  gap: 0.5rem;
}

.level-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.level-dot.completed {
  background: #FFD700;
  color: #333;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.level-dot.current {
  background: #FFD700;
  color: #333;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.chapter-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8));
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 3;
  border-radius: 24px;
}

.select-btn {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #333;
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.select-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.select-btn:hover::before {
  left: 100%;
}

.select-btn:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 15px 35px rgba(255, 215, 0, 0.6);
  background: linear-gradient(135deg, #FFA500, #FFD700);
}

.select-btn:active {
  transform: scale(1.02) translateY(0px);
}

@media (max-width: 768px) {
  .chapter-selection {
    padding: 1rem;
  }

  .header {
    margin-bottom: 2.5rem;
  }

  .header-icon {
    font-size: 3rem;
  }

  .title-main {
    font-size: 2.5rem;
  }

  .title-sub {
    font-size: 1.2rem;
  }

  .header-description {
    font-size: 1rem;
    padding: 0 1rem;
  }

  .chapters-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 100%;
  }

  .chapter-card {
    padding: 2rem;
    min-height: 280px;
    margin: 0 0.5rem;
  }

  .chapter-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .chapter-progress {
    text-align: center;
  }

  .chapter-stats {
    gap: 1.5rem;
    justify-content: center;
  }

  .select-btn {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  .floating-shape {
    display: none;
    /* 在移动端隐藏装饰元素以提高性能 */
  }
}

@media (max-width: 480px) {
  .chapter-selection {
    padding: 0.5rem;
  }

  .title-main {
    font-size: 2rem;
  }

  .chapter-card {
    padding: 1.5rem;
    margin: 0;
  }

  .chapters-container {
    gap: 1.5rem;
  }
}
</style>