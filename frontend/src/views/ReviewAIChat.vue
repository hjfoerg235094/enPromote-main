<template>
  <main class="learn-page review-page">
    <section class="review-hero">
      <div>
        <span class="learn-kicker">学习报告</span>
        <h1>看见今天的表现，再决定下一轮怎么练</h1>
        <p>报告负责告诉你问题在哪里，AI 练习负责把问题转成可执行的口语和表达训练。</p>
      </div>
      <button class="learn-button" type="button" @click="goToFreeChat">开始 AI 针对练习</button>
    </section>

    <section class="report-grid">
      <article v-for="item in reportMetrics" :key="item.label" class="report-metric learn-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ item.desc }}</p>
      </article>
    </section>

    <section class="review-layout">
      <article class="report-panel learn-card">
        <div class="section-heading">
          <span class="learn-kicker">今日概览</span>
          <button class="learn-button secondary" type="button" @click="viewFullReport">查看完整报告</button>
        </div>
        <div class="overview-list">
          <div>
            <span>学习时长</span>
            <strong>{{ formatTime(reportData.totalStudyTime) }}</strong>
          </div>
          <div>
            <span>学习单词</span>
            <strong>{{ reportData.wordsLearned || 0 }}</strong>
          </div>
          <div>
            <span>正确率</span>
            <strong>{{ reportData.accuracy || 0 }}%</strong>
          </div>
          <div>
            <span>掌握率</span>
            <strong>{{ reportData.masteryRate || 0 }}%</strong>
          </div>
        </div>
      </article>

      <article class="weak-panel learn-card">
        <div class="section-heading">
          <span class="learn-kicker">薄弱点</span>
          <small>没有数据时不制造假问题</small>
        </div>

        <div v-if="weakPoints.length > 0" class="weak-list">
          <div v-for="(point, index) in weakPoints" :key="index" class="weak-item">
            <span class="weak-icon">{{ getWeakPointIcon(point.type) }}</span>
            <div>
              <strong>{{ point.title }}</strong>
              <p>{{ point.description }}</p>
            </div>
            <button class="learn-button secondary" type="button" @click="practiceWeakPoint(point)">针对练习</button>
          </div>
        </div>
        <div v-else class="empty-state">
          <strong>暂时没有明显薄弱点</strong>
          <p>可以先完成一轮闯关或 AI 口语，报告会在有数据后给出更具体的建议。</p>
          <button class="learn-button secondary" type="button" @click="goToAdventure">去闯关</button>
        </div>
      </article>
    </section>

    <section class="chat-practice">
      <article class="practice-card primary" @click="goToFreeChat">
        <span>自由表达</span>
        <h2>AI 口语热身</h2>
        <p>适合没有明确薄弱点时，先用今日主题聊 5 分钟。</p>
      </article>
      <article class="practice-card" @click="goToTaskChat">
        <span>报告驱动</span>
        <h2>任务型对话</h2>
        <p>基于今日表现进行针对练习，优先纠正常见表达问题。</p>
      </article>
      <article class="practice-card" @click="goToWeakPointChat">
        <span>薄弱点加练</span>
        <h2>专项对话</h2>
        <p>围绕单词、听力、口语或语法薄弱项做短时训练。</p>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from '@/utils/toastService'

const router = useRouter()

const reportData = ref({
  totalStudyTime: 0,
  wordsLearned: 0,
  accuracy: 0,
  masteryRate: 0,
  continuousDays: 0
})

const weakPoints = ref([])

const reportMetrics = computed(() => [
  { label: '今日学习', value: formatTime(reportData.value.totalStudyTime), desc: '累计投入时间' },
  { label: '新学单词', value: reportData.value.wordsLearned || 0, desc: '今日学习记录' },
  { label: '正确率', value: `${reportData.value.accuracy || 0}%`, desc: '练习题表现' },
  { label: '连续天数', value: reportData.value.continuousDays || 0, desc: '学习习惯反馈' }
])

const formatTime = (minutes) => {
  if (!minutes) return '0 分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`
}

const getWeakPointIcon = (type) => {
  const icons = {
    vocabulary: 'Aa',
    listening: '听',
    speaking: '说',
    grammar: '句',
    reading: '读'
  }
  return icons[type] || '练'
}

const viewFullReport = () => router.push('/daily-report')

const practiceWeakPoint = (point) => {
  if (point.type === 'vocabulary') {
    router.push('/flashCardReview?mode=weakpoints')
    return
  }
  if (point.type === 'speaking' || point.type === 'grammar') {
    router.push(`/aiChatExer?mode=${point.type}`)
    return
  }
  toast.info('这个专项入口正在整理中，先为你打开 AI 针对练习。')
  router.push('/aiChatExer?mode=weakpoints')
}

const goToFreeChat = () => router.push('/aiChatExer')
const goToTaskChat = () => router.push('/aiChatExer?mode=task')
const goToWeakPointChat = () => router.push('/aiChatExer?mode=weakpoints')
const goToAdventure = () => router.push('/adventure-story')

const fetchReportData = async () => {
  try {
    const res = await axios.get('/api/daily-report/today')
    if (res.data?.code === 200) {
      reportData.value = res.data.data.report || reportData.value
      weakPoints.value = res.data.data.weakPoints || []
    }
  } catch (error) {
    console.error('获取学习报告失败:', error)
  }
}

onMounted(fetchReportData)
</script>

<style scoped>
.review-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: end;
  padding: 34px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(240, 164, 58, 0.14), rgba(66, 119, 184, 0.12)), #fffdf7;
  box-shadow: var(--learn-shadow-soft);
  margin-bottom: 20px;
}

.review-hero h1 {
  margin: 16px 0 10px;
  font-size: clamp(32px, 5vw, 54px);
  line-height: 1.08;
}

.review-hero p {
  max-width: 760px;
  margin: 0;
  color: var(--learn-muted);
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.report-metric {
  padding: 20px;
}

.report-metric span,
.overview-list span,
.practice-card span {
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

.report-metric strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
}

.report-metric p,
.weak-item p,
.empty-state p,
.practice-card p {
  color: var(--learn-muted);
}

.review-layout {
  display: grid;
  grid-template-columns: 0.95fr 1.25fr;
  gap: 18px;
  margin-bottom: 20px;
}

.report-panel,
.weak-panel {
  padding: 24px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.section-heading small {
  color: var(--learn-muted);
}

.overview-list {
  display: grid;
  gap: 12px;
}

.overview-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: #fff;
}

.weak-list {
  display: grid;
  gap: 12px;
}

.weak-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  background: #fff;
}

.weak-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 15px;
  background: var(--learn-coral-soft);
  color: var(--learn-coral);
  font-weight: 900;
}

.empty-state {
  padding: 24px;
  border-radius: 20px;
  background: var(--learn-green-soft);
}

.chat-practice {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.practice-card {
  padding: 24px;
  border: 1px solid var(--learn-line);
  border-radius: 26px;
  background: #fff;
  box-shadow: var(--learn-shadow-soft);
  cursor: pointer;
}

.practice-card.primary {
  background: linear-gradient(135deg, #1f8a70, #2d6d60);
  color: #fff;
}

.practice-card.primary span,
.practice-card.primary p {
  color: rgba(255, 255, 255, 0.78);
}

.practice-card h2 {
  margin: 8px 0;
}

@media (max-width: 920px) {
  .review-hero,
  .report-grid,
  .review-layout,
  .chat-practice,
  .weak-item {
    grid-template-columns: 1fr;
  }
}
</style>
