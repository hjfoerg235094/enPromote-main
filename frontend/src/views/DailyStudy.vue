
<template>
  <div class="daily-study-container">
    <div class="study-header">
      <h1 class="page-title">今日学习</h1>
      <p class="page-subtitle">完成每日学习任务，持续提升英语能力</p>
    </div>

    <!-- 学习进度概览 -->
    <div class="progress-overview">
      <div class="progress-card">
        <div class="progress-icon">📅</div>
        <div class="progress-info">
          <div class="progress-value">{{ checkInData.continuousCheckInDays || 0 }}</div>
          <div class="progress-label">连续签到天数</div>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">📚</div>
        <div class="progress-info">
          <div class="progress-value">{{ reviewData.todayReviewedCount || 0 }}</div>
          <div class="progress-label">今日已复习单词</div>
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-icon">🎯</div>
        <div class="progress-info">
          <div class="progress-value">{{ completedTasks }}/{{ totalTasks }}</div>
          <div class="progress-label">今日任务完成</div>
        </div>
      </div>
    </div>

    <!-- 学习任务列表 -->
    <div class="study-tasks">
      <h2 class="section-title">今日学习任务</h2>

      <!-- 签到任务 -->
      <div class="task-card" :class="{ completed: checkInData.hasCheckedInToday }">
        <div class="task-icon">✅</div>
        <div class="task-content">
          <h3>每日签到</h3>
          <p>坚持学习，养成好习惯</p>
        </div>
        <button 
          class="task-button" 
          :class="{ disabled: checkInData.hasCheckedInToday }"
          @click="goToCheckIn"
          :disabled="checkInData.hasCheckedInToday"
        >
          {{ checkInData.hasCheckedInToday ? '已完成' : '去签到' }}
        </button>
      </div>

      <!-- 单词复习任务 -->
      <div class="task-card" :class="{ completed: reviewData.todayReviewedCount >= reviewData.dailyTarget }">
        <div class="task-icon">📖</div>
        <div class="task-content">
          <h3>单词复习</h3>
          <p>今日已复习 {{ reviewData.todayReviewedCount || 0 }}/{{ reviewData.dailyTarget || 20 }} 个单词</p>
        </div>
        <button 
          class="task-button" 
          :class="{ disabled: reviewData.todayReviewedCount >= reviewData.dailyTarget }"
          @click="goToWordReview"
          :disabled="reviewData.todayReviewedCount >= reviewData.dailyTarget"
        >
          {{ reviewData.todayReviewedCount >= reviewData.dailyTarget ? '已完成' : '去复习' }}
        </button>
      </div>

      <!-- 闪卡练习任务 -->
      <div class="task-card" :class="{ completed: flashCardCompleted }">
        <div class="task-icon">🎴</div>
        <div class="task-content">
          <h3>闪卡练习</h3>
          <p>通过闪卡强化单词记忆</p>
        </div>
        <button 
          class="task-button" 
          :class="{ disabled: flashCardCompleted }"
          @click="goToFlashCard"
          :disabled="flashCardCompleted"
        >
          {{ flashCardCompleted ? '已完成' : '去练习' }}
        </button>
      </div>

      <!-- 薄弱点回顾任务 -->
      <div class="task-card" :class="{ completed: weakPointsReviewed }">
        <div class="task-icon">🔍</div>
        <div class="task-content">
          <h3>薄弱点回顾</h3>
          <p>针对薄弱环节进行强化练习</p>
        </div>
        <button 
          class="task-button" 
          :class="{ disabled: weakPointsReviewed }"
          @click="goToWeakPoints"
          :disabled="weakPointsReviewed"
        >
          {{ weakPointsReviewed ? '已完成' : '去回顾' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCheckInStatus } from '@/api/checkin'
import { getReviewWords } from '@/api/word'

const router = useRouter()

// 响应式数据
const checkInData = ref({
  continuousCheckInDays: 0,
  totalCheckInDays: 0,
  hasCheckedInToday: false
})

const reviewData = ref({
  todayReviewedCount: 0,
  dailyTarget: 20,
  pendingReviewCount: 0
})

const flashCardCompleted = ref(false)
const weakPointsReviewed = ref(false)

// 计算属性
const completedTasks = computed(() => {
  let count = 0
  if (checkInData.value.hasCheckedInToday) count++
  if (reviewData.value.todayReviewedCount >= reviewData.value.dailyTarget) count++
  if (flashCardCompleted.value) count++
  if (weakPointsReviewed.value) count++
  return count
})

const totalTasks = computed(() => 4)

// 方法
const goToCheckIn = () => {
  router.push('/checkin')
}

const goToWordReview = () => {
  router.push('/wordReview')
}

const goToFlashCard = () => {
  router.push('/flashCardReview')
}

const goToWeakPoints = () => {
  // 这里可以导航到薄弱点回顾页面，暂时使用闪卡页面作为替代
  router.push('/flashCardReview?mode=weakpoints')
}

// 获取签到状态
const fetchCheckInStatus = async () => {
  try {
    const res = await getCheckInStatus()
    if (res.data && res.data.code === 200) {
      checkInData.value = res.data.data
    }
  } catch (error) {
    console.error('获取签到状态失败:', error)
  }
}

// 获取单词复习数据
const fetchReviewData = async () => {
  try {
    const res = await getReviewWords()
    if (res.data && res.data.code === 200) {
      reviewData.value.pendingReviewCount = res.data.data.count
      // 这里可以添加获取今日已复习单词数量的逻辑
    }
  } catch (error) {
    console.error('获取复习数据失败:', error)
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchCheckInStatus()
  fetchReviewData()
})
</script>

<style scoped>
.daily-study-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.study-header {
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

.study-tasks {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
}

.task-card {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: #f9f9f9;
  transition: all 0.3s ease;
}

.task-card:hover {
  background: #f0f0f0;
}

.task-card.completed {
  background: #e8f5e9;
}

.task-icon {
  font-size: 28px;
  margin-right: 20px;
}

.task-content {
  flex: 1;
}

.task-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 5px 0;
}

.task-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.task-button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #4facfe;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-button:hover:not(.disabled) {
  background: #00f2fe;
}

.task-button.disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
