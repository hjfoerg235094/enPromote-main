
<template>
  <div class="review-ai-chat-container">
    <div class="review-header">
      <h1 class="page-title">复盘/AI对话</h1>
      <p class="page-subtitle">查看学习报告，通过AI对话针对性提升薄弱环节</p>
    </div>

    <!-- 学习报告概览 -->
    <div class="report-overview">
      <div class="report-card">
        <div class="report-icon">📊</div>
        <div class="report-info">
          <div class="report-value">{{ formatTime(reportData.totalStudyTime) }}</div>
          <div class="report-label">今日学习时长</div>
        </div>
      </div>
      <div class="report-card">
        <div class="report-icon">📚</div>
        <div class="report-info">
          <div class="report-value">{{ reportData.wordsLearned || 0 }}</div>
          <div class="report-label">今日学习单词</div>
        </div>
      </div>
      <div class="report-card">
        <div class="report-icon">🎯</div>
        <div class="report-info">
          <div class="report-value">{{ reportData.accuracy || 0 }}%</div>
          <div class="report-label">今日正确率</div>
        </div>
      </div>
      <div class="report-card">
        <div class="report-icon">🔥</div>
        <div class="report-info">
          <div class="report-value">{{ reportData.continuousDays || 0 }}</div>
          <div class="report-label">连续学习天数</div>
        </div>
      </div>
    </div>

    <!-- 学习报告与AI对话 -->
    <div class="review-chat-section">
      <div class="section-container">
        <h2 class="section-title">学习报告</h2>
        <div class="report-content">
          <div class="report-card detailed">
            <h3>今日学习概览</h3>
            <div class="report-stats">
              <div class="stat-item">
                <span class="stat-label">学习时长</span>
                <span class="stat-value">{{ formatTime(reportData.totalStudyTime) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">学习单词</span>
                <span class="stat-value">{{ reportData.wordsLearned || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">正确率</span>
                <span class="stat-value">{{ reportData.accuracy || 0 }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">掌握率</span>
                <span class="stat-value">{{ formatPercentage(reportData.masteryRate || 0) }}</span>
              </div>
            </div>
            <button class="view-report-button" @click="viewFullReport">查看完整报告</button>
          </div>

          <div class="report-card detailed">
            <h3>薄弱点分析</h3>
            <div class="weak-points" v-if="weakPoints.length > 0">
              <div 
                v-for="(point, index) in weakPoints" 
                :key="index" 
                class="weak-point-item"
              >
                <div class="point-icon">{{ getWeakPointIcon(point.type) }}</div>
                <div class="point-content">
                  <div class="point-title">{{ point.title }}</div>
                  <div class="point-desc">{{ point.description }}</div>
                </div>
                <button 
                  class="practice-button" 
                  @click="practiceWeakPoint(point)"
                >
                  针对性练习
                </button>
              </div>
            </div>
            <div v-else class="no-weak-points">
              <div class="no-data-icon">🎉</div>
              <p>太棒了！目前没有发现明显的薄弱点</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section-container">
        <h2 class="section-title">AI对话练习</h2>
        <div class="chat-options">
          <div class="chat-option-card" @click="goToFreeChat">
            <div class="chat-option-icon">💬</div>
            <div class="chat-option-content">
              <h3>自由对话</h3>
              <p>选择AI老师，进行自由对话练习</p>
              <div class="chat-option-features">
                <span class="feature-tag">🎭 5种AI性格</span>
                <span class="feature-tag">💡 实时反馈</span>
                <span class="feature-tag">🔄 24/7可用</span>
              </div>
            </div>
            <div class="chat-option-arrow">→</div>
          </div>

          <div class="chat-option-card" @click="goToTaskChat">
            <div class="chat-option-icon">🎯</div>
            <div class="chat-option-content">
              <h3>任务导向对话</h3>
              <p>基于学习报告，AI老师会根据你的薄弱点进行针对性练习</p>
              <div class="chat-option-features">
                <span class="feature-tag">📊 基于数据</span>
                <span class="feature-tag">🎯 针对性强</span>
                <span class="feature-tag">📈 效果显著</span>
              </div>
            </div>
            <div class="chat-option-arrow">→</div>
          </div>

          <div class="chat-option-card" @click="goToWeakPointChat">
            <div class="chat-option-icon">🔍</div>
            <div class="chat-option-content">
              <h3>薄弱点对话练习</h3>
              <p>选择你的薄弱环节，进行专项对话练习</p>
              <div class="chat-option-features">
                <span class="feature-tag">📚 词汇薄弱</span>
                <span class="feature-tag">🎧 听力薄弱</span>
                <span class="feature-tag">🎤 口语薄弱</span>
              </div>
            </div>
            <div class="chat-option-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 响应式数据
const reportData = ref({
  totalStudyTime: 0, // 以分钟为单位
  wordsLearned: 0,
  accuracy: 0,
  masteryRate: 0,
  continuousDays: 0
})

const weakPoints = ref([])

// 方法
const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

const formatPercentage = (value) => {
  return `${(value * 100).toFixed(2)}%`
}

const getWeakPointIcon = (type) => {
  const icons = {
    vocabulary: '📚',
    listening: '🎧',
    speaking: '🎤',
    grammar: '📝',
    reading: '📖'
  }
  return icons[type] || '🔍'
}

const viewFullReport = () => {
  router.push('/daily-report')
}

const practiceWeakPoint = (point) => {
  // 根据薄弱点类型导航到相应的练习页面
  if (point.type === 'vocabulary') {
    router.push('/flashCardReview?mode=weakpoints')
  } else if (point.type === 'listening') {
    router.push('/listening-legacy')
  } else if (point.type === 'speaking') {
    router.push('/oral')
  } else if (point.type === 'grammar') {
    router.push('/aiChatExer?mode=grammar')
  } else if (point.type === 'reading') {
    router.push('/reading')
  }
}

const goToFreeChat = () => {
  router.push('/aiChatExer')
}

const goToTaskChat = () => {
  // 导航到任务导向对话，并传递基于学习报告的任务参数
  router.push('/aiChatExer?mode=task')
}

const goToWeakPointChat = () => {
  // 导航到薄弱点对话，并传递薄弱点类型
  router.push('/aiChatExer?mode=weakpoints')
}

// 获取学习报告数据
const fetchReportData = async () => {
  try {
    const res = await axios.get('/api/report/daily')
    if (res.data && res.data.code === 200) {
      const data = res.data.data
      reportData.value = {
        totalStudyTime: data.totalStudyTime || 0,
        wordsLearned: (data.wordsLearned?.newWords || 0) + (data.wordsLearned?.reviewWords || 0),
        accuracy: data.practiceStats?.spellingAccuracy || 0,
        masteryRate: data.efficiency?.masteryRate || 0,
        continuousDays: data.achievements?.continuousDays || 0
      }

      // 分析薄弱点
      const points = []

      // 分析词汇掌握情况
      if (data.efficiency?.masteryRate < 0.5) {
        points.push({
          type: 'vocabulary',
          title: '词汇掌握度偏低',
          description: `当前掌握率为${formatPercentage(data.efficiency.masteryRate)}，建议加强词汇复习`
        })
      }

      // 分析听力完成情况
      if (data.practiceStats?.listeningCompletion < 0.7) {
        points.push({
          type: 'listening',
          title: '听力练习不足',
          description: `当前听力完成率为${formatPercentage(data.practiceStats.listeningCompletion)}，建议增加听力练习`
        })
      }

      // 分析拼写正确率
      if (data.practiceStats?.spellingAccuracy < 0.7) {
        points.push({
          type: 'grammar',
          title: '拼写正确率偏低',
          description: `当前拼写正确率为${formatPercentage(data.practiceStats.spellingAccuracy)}，建议加强拼写练习`
        })
      }

      // 分析学习时长
      if (data.totalStudyTime < 30) {
        points.push({
          type: 'vocabulary',
          title: '学习时长不足',
          description: `今日学习时长仅${formatTime(data.totalStudyTime)}，建议增加学习时间`
        })
      }

      weakPoints.value = points
    }
  } catch (error) {
    console.error('获取学习报告失败:', error)
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchReportData()
})
</script>

<style scoped>
.review-ai-chat-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.review-header {
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

.report-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.report-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
}

.report-card.detailed {
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 20px;
}

.report-icon {
  font-size: 32px;
}

.report-info {
  display: flex;
  flex-direction: column;
}

.report-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.report-label {
  font-size: 14px;
  color: #666;
}

.review-chat-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
}

.section-container {
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

.report-content {
  display: flex;
  flex-direction: column;
}

.report-card.detailed h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.view-report-button {
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

.view-report-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.weak-points {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weak-point-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  gap: 16px;
}

.point-icon {
  font-size: 28px;
}

.point-content {
  flex: 1;
}

.point-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.point-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.practice-button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #4facfe;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.practice-button:hover {
  background: #00f2fe;
}

.no-weak-points {
  text-align: center;
  padding: 40px 20px;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-weak-points p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.chat-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-option-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-option-card:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.chat-option-icon {
  font-size: 40px;
  margin-right: 16px;
}

.chat-option-content {
  flex: 1;
}

.chat-option-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 6px 0;
}

.chat-option-content p {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.chat-option-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  padding: 4px 12px;
  border-radius: 16px;
  background: #e0e0e0;
  font-size: 12px;
  color: #666;
}

.chat-option-arrow {
  font-size: 24px;
  color: #999;
}
</style>
