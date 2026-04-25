<template>
  <main class="learn-page daily-page">
    <section class="daily-hero">
      <div>
        <span class="learn-kicker">今日任务</span>
        <h1>先完成基础任务，再进入情境表达</h1>
        <p>今天的路线按“签到、单词、闯关、AI 口语”推进。部分任务暂无实时完成接口，会用“建议完成”标记，不伪造成已完成。</p>
      </div>
      <div class="today-score learn-card">
        <span>已确认完成</span>
        <strong>{{ completedTasks }}/{{ totalTasks }}</strong>
        <div class="learn-progress">
          <span :style="{ width: completionRate + '%' }"></span>
        </div>
      </div>
    </section>

    <section class="metric-grid">
      <article class="metric-card learn-card">
        <span>连续学习</span>
        <strong>{{ checkInData.continuousCheckInDays || 0 }} 天</strong>
        <p>{{ checkInData.hasCheckedInToday ? '今天已签到' : '今天还未签到' }}</p>
      </article>
      <article class="metric-card learn-card">
        <span>待复习单词</span>
        <strong>{{ reviewData.pendingReviewCount || 0 }}</strong>
        <p>优先清掉待复习，再学新内容</p>
      </article>
      <article class="metric-card learn-card">
        <span>今日主线</span>
        <strong>1 关</strong>
        <p>推进一个场景任务即可</p>
      </article>
    </section>

    <section class="task-track">
      <article
        v-for="task in tasks"
        :key="task.key"
        class="task-card"
        :class="{ completed: task.completed, recommended: task.recommended }"
      >
        <div class="task-index">{{ task.index }}</div>
        <div class="task-body">
          <div class="task-topline">
            <span>{{ task.type }}</span>
            <strong>{{ task.completed ? '已完成' : task.status }}</strong>
          </div>
          <h2>{{ task.title }}</h2>
          <p>{{ task.desc }}</p>
        </div>
        <button class="learn-button" :class="{ secondary: !task.recommended }" type="button" @click="task.action">
          {{ task.cta }}
        </button>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCheckInStatus } from '@/api/checkin'
import { getReviewWords } from '@/api/word'

const router = useRouter()

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

const tasks = computed(() => [
  {
    key: 'checkin',
    index: '01',
    type: '习惯养成',
    title: '每日签到',
    desc: '点亮今天的学习记录，保持连续反馈。',
    completed: checkInData.value.hasCheckedInToday,
    recommended: !checkInData.value.hasCheckedInToday,
    status: '待完成',
    cta: checkInData.value.hasCheckedInToday ? '查看签到' : '去签到',
    action: goToCheckIn
  },
  {
    key: 'review',
    index: '02',
    type: '记忆巩固',
    title: '单词复习',
    desc: `当前有 ${reviewData.value.pendingReviewCount || 0} 个单词等待复习。`,
    completed: (reviewData.value.pendingReviewCount || 0) === 0,
    recommended: (reviewData.value.pendingReviewCount || 0) > 0,
    status: '建议完成',
    cta: (reviewData.value.pendingReviewCount || 0) > 0 ? '开始复习' : '查看单词',
    action: goToWordReview
  },
  {
    key: 'chapter',
    index: '03',
    type: '主线闯关',
    title: '推进一个场景关卡',
    desc: '用酒店或餐厅场景串起词汇、听力和实战对话。',
    completed: false,
    recommended: (reviewData.value.pendingReviewCount || 0) === 0,
    status: '建议完成',
    cta: '去闯关',
    action: goToChapters
  },
  {
    key: 'chat',
    index: '04',
    type: '表达输出',
    title: 'AI 口语热身',
    desc: '用 5 分钟把今日词汇说进真实表达里。',
    completed: false,
    recommended: false,
    status: '可选加练',
    cta: '开始对话',
    action: goToFreeChat
  }
])

const completedTasks = computed(() => tasks.value.filter((task) => task.completed).length)
const totalTasks = computed(() => tasks.value.length)
const completionRate = computed(() => Math.round((completedTasks.value / totalTasks.value) * 100))

const goToCheckIn = () => router.push('/checkin')
const goToWordReview = () => router.push('/flashCardReview')
const goToChapters = () => router.push('/adventure-story')
const goToFreeChat = () => router.push('/aiChatExer')

const fetchCheckInStatus = async () => {
  try {
    const res = await getCheckInStatus()
    if (res.data?.code === 200) checkInData.value = res.data.data
  } catch (error) {
    console.error('获取签到状态失败:', error)
  }
}

const fetchReviewData = async () => {
  try {
    const res = await getReviewWords()
    if (res.data?.code === 200) {
      reviewData.value.pendingReviewCount = res.data.data.count || 0
    }
  } catch (error) {
    console.error('获取复习数据失败:', error)
  }
}

onMounted(() => {
  fetchCheckInStatus()
  fetchReviewData()
})
</script>

<style scoped>
.daily-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 22px;
  align-items: stretch;
  margin-bottom: 20px;
}

.daily-hero > div:first-child {
  padding: 34px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(31, 138, 112, 0.12), rgba(240, 164, 58, 0.12)), #fffdf7;
  box-shadow: var(--learn-shadow-soft);
}

.daily-hero h1 {
  margin: 16px 0 10px;
  font-size: clamp(32px, 5vw, 54px);
  line-height: 1.08;
  letter-spacing: 0;
}

.daily-hero p {
  max-width: 760px;
  margin: 0;
  color: var(--learn-muted);
}

.today-score {
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 24px;
}

.today-score span,
.metric-card span {
  color: var(--learn-muted);
  font-weight: 800;
}

.today-score strong {
  font-size: 44px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 22px;
}

.metric-card strong {
  display: block;
  margin-top: 6px;
  font-size: 30px;
}

.metric-card p {
  margin-bottom: 0;
  color: var(--learn-muted);
}

.task-track {
  display: grid;
  gap: 14px;
}

.task-card {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--learn-line);
  border-radius: 24px;
  background: #fff;
  box-shadow: var(--learn-shadow-soft);
}

.task-card.recommended {
  border-color: rgba(31, 138, 112, 0.34);
  background: linear-gradient(90deg, rgba(223, 243, 232, 0.88), #fff);
}

.task-card.completed {
  background: var(--learn-green-soft);
}

.task-index {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: var(--learn-ink);
  color: #fff;
  font-weight: 900;
}

.task-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

.task-topline strong {
  color: var(--learn-primary-dark);
}

.task-body h2 {
  margin: 5px 0;
  font-size: 22px;
}

.task-body p {
  margin: 0;
  color: var(--learn-muted);
}

@media (max-width: 860px) {
  .daily-hero,
  .metric-grid,
  .task-card {
    grid-template-columns: 1fr;
  }

  .task-card {
    align-items: start;
  }
}
</style>
