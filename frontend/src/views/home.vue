<template>
  <main class="home-page">
    <section class="home-hero">
      <div class="hero-copy">
        <span class="learn-kicker">今日英语训练台</span>
        <h1>{{ storeUsername ? `${storeUsername}，今天从这里继续` : '把英语学习变成每天能完成的一关' }}</h1>
        <p>
          先用任务卡完成单词和闯关，再用 AI 口语把表达说出来。少一点找入口，多一点真正练习。
        </p>
        <div class="hero-actions">
          <button class="learn-button" type="button" @click="startTodayStudy">继续今日任务</button>
          <button class="learn-button secondary" type="button" @click="goToFreeChat">AI 口语热身</button>
        </div>
      </div>

      <div class="mission-panel learn-card">
        <div class="panel-top">
          <div>
            <span class="panel-label">今日建议</span>
            <h2>{{ personalizedGuide }}</h2>
          </div>
          <div class="streak-pill">{{ checkInData?.continuousCheckInDays || 0 }} 天连续</div>
        </div>

        <div class="mission-progress">
          <div class="progress-meta">
            <span>任务完成度</span>
            <strong>{{ completedMissionCount }}/{{ missions.length }}</strong>
          </div>
          <div class="learn-progress">
            <span :style="{ width: missionProgress + '%' }"></span>
          </div>
        </div>

        <div class="mission-list">
          <button
            v-for="mission in missions"
            :key="mission.key"
            class="mission-item"
            :class="{ done: mission.done }"
            type="button"
            @click="mission.action"
          >
            <span class="mission-icon">{{ mission.icon }}</span>
            <span>
              <strong>{{ mission.title }}</strong>
              <small>{{ mission.desc }}</small>
            </span>
            <em>{{ mission.done ? '已完成' : '去完成' }}</em>
          </button>
        </div>
      </div>
    </section>

    <section class="quick-grid">
      <article class="quick-card featured" @click="goToChapters">
        <span class="quick-eyebrow">主线推荐</span>
        <h2>闯关学习</h2>
        <p>酒店、餐厅场景按词汇、拼写、听力、AI 题目、实战对话推进。</p>
        <div class="flow-line">
          <span>词汇</span>
          <span>拼写</span>
          <span>听力</span>
          <span>AI 题目</span>
          <span>对话</span>
        </div>
      </article>

      <article class="quick-card" @click="goToFreeChat">
        <span class="quick-eyebrow">表达训练</span>
        <h2>AI 口语</h2>
        <p>用今日单词开口表达，先完成一段 5 分钟轻练习。</p>
      </article>

      <article class="quick-card" @click="goToReport">
        <span class="quick-eyebrow">复盘反馈</span>
        <h2>学习报告</h2>
        <p>查看今日数据、薄弱点和下一轮针对练习。</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="data-card learn-card">
        <span>待复习单词</span>
        <strong>{{ reviewData?.pendingReviewCount ?? 0 }}</strong>
        <p>{{ reviewData?.pendingReviewCount ? '建议先复习再进入新关卡。' : '当前没有待复习单词，可以进入新任务。' }}</p>
        <button class="learn-button secondary" type="button" @click="goToWordReview">打开单词复习</button>
      </article>

      <article class="data-card learn-card">
        <span>签到状态</span>
        <strong>{{ checkInData?.hasCheckedInToday ? '已签到' : '待签到' }}</strong>
        <p>连续记录会让每日任务更有反馈感。</p>
        <button class="learn-button secondary" type="button" @click="goToCheckIn">
          {{ checkInData?.hasCheckedInToday ? '查看签到' : '立即签到' }}
        </button>
      </article>

      <article class="coach-card learn-card">
        <span class="learn-kicker">AI 教练</span>
        <h2>今天的口语目标</h2>
        <p>用 3 句话介绍一次入住酒店或点餐经历，尽量用上今天复习过的单词。</p>
        <button class="learn-button" type="button" @click="goToFreeChat">开始练 5 分钟</button>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getUserInfo, username as storeUsername } from '@/stores/userStore'
import { getCheckInStatus } from '@/api/checkin'
import { getReviewWords } from '@/api/word'
import { getDailyStudyReport } from '@/api/report'
import { useRouter } from 'vue-router'

const router = useRouter()
const checkInData = ref(null)
const reviewData = ref(null)

const hasReviewedToday = computed(() => (reviewData.value?.todayReviewedCount || 0) > 0)

const missions = computed(() => [
  {
    key: 'checkin',
    icon: '✓',
    title: '完成签到',
    desc: checkInData.value?.hasCheckedInToday ? '今天的学习记录已点亮' : '先点亮今日学习状态',
    done: Boolean(checkInData.value?.hasCheckedInToday),
    action: goToCheckIn
  },
  {
    key: 'review',
    icon: 'Aa',
    title: '单词复习',
    desc: hasReviewedToday.value
      ? `今天已复习 ${reviewData.value?.todayReviewedCount || 0} 个单词`
      : `${reviewData.value?.pendingReviewCount ?? 0} 个单词等待巩固`,
    done: hasReviewedToday.value || (reviewData.value?.pendingReviewCount ?? 0) === 0,
    action: goToWordReview
  },
  {
    key: 'chapter',
    icon: '→',
    title: '推进一关',
    desc: '完成一个场景任务，把单词放进语境',
    done: false,
    action: goToChapters
  },
  {
    key: 'chat',
    icon: 'AI',
    title: 'AI 口语热身',
    desc: '用 5 分钟把今天的表达说出来',
    done: false,
    action: goToFreeChat
  }
])

const completedMissionCount = computed(() => missions.value.filter((item) => item.done).length)
const missionProgress = computed(() => Math.round((completedMissionCount.value / missions.value.length) * 100))

const personalizedGuide = computed(() => {
  if (!storeUsername.value) return '注册后即可生成你的每日学习路线'
  if (!hasReviewedToday.value && reviewData.value?.pendingReviewCount > 0) return `先复习 ${Math.min(reviewData.value.pendingReviewCount, 20)} 个单词，再推进一关`
  if (!checkInData.value?.hasCheckedInToday) return '先签到，再完成一轮闯关和 AI 口语'
  return '今天适合直接推进一关，再用 AI 做口语巩固'
})

onMounted(async () => {
  try {
    const userInfo = await getUserInfo()
    if (userInfo) {
      await Promise.all([fetchCheckInStatus(), fetchReviewData()])
    }
  } catch (error) {
    console.log('首页用户状态获取失败:', error)
  }
})

function startTodayStudy() {
  router.push('/daily-study')
}

function goToChapters() {
  router.push('/chapters')
}

function goToFreeChat() {
  router.push('/aiChatExer')
}

function goToReport() {
  router.push('/review-ai-chat')
}

function goToCheckIn() {
  router.push('/checkin')
}

function goToWordReview() {
  router.push('/flashCardReview')
}

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
    const [reviewRes, reportRes] = await Promise.all([
      getReviewWords(),
      getDailyStudyReport()
    ])
    if (reviewRes.data?.code === 200) {
      reviewData.value = {
        pendingReviewCount: reviewRes.data.data.count || 0,
        todayReviewedCount: reportRes.data?.code === 200
          ? reportRes.data.data?.wordsLearned?.reviewWords || 0
          : 0
      }
    }
  } catch (error) {
    console.error('获取复习数据失败:', error)
  }
}
</script>

<style scoped>
.home-page {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 34px 0 64px;
}

.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 28px;
  align-items: stretch;
}

.hero-copy {
  min-height: 430px;
  padding: 42px;
  border-radius: 32px;
  background:
    linear-gradient(135deg, rgba(31, 138, 112, 0.12), rgba(240, 164, 58, 0.16)),
    var(--learn-surface);
  box-shadow: var(--learn-shadow);
}

.hero-copy h1 {
  max-width: 720px;
  margin: 18px 0 14px;
  font-size: clamp(36px, 6vw, 68px);
  line-height: 1.02;
  letter-spacing: 0;
}

.hero-copy p {
  max-width: 620px;
  color: var(--learn-muted);
  font-size: 18px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.mission-panel {
  padding: 24px;
}

.panel-top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
}

.panel-label,
.quick-eyebrow,
.data-card span {
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

.panel-top h2 {
  margin: 4px 0 0;
  font-size: 25px;
  line-height: 1.25;
}

.streak-pill {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--learn-amber-soft);
  color: #8a5a07;
  font-weight: 900;
}

.mission-progress {
  margin: 24px 0;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--learn-muted);
  font-size: 14px;
}

.mission-list {
  display: grid;
  gap: 10px;
}

.mission-item {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px;
  border-radius: 18px;
  background: #fff;
  color: var(--learn-ink);
  text-align: left;
  cursor: pointer;
}

.mission-item.done {
  background: var(--learn-green-soft);
}

.mission-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--learn-ink);
  color: #fff;
  font-weight: 900;
}

.mission-item small {
  display: block;
  color: var(--learn-muted);
}

.mission-item em {
  color: var(--learn-primary-dark);
  font-size: 13px;
  font-style: normal;
  font-weight: 900;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr;
  gap: 18px;
  margin-top: 22px;
}

.quick-card {
  min-height: 210px;
  padding: 26px;
  border: 1px solid var(--learn-line);
  border-radius: 26px;
  background: var(--learn-surface-strong);
  cursor: pointer;
  box-shadow: var(--learn-shadow-soft);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--learn-shadow);
}

.quick-card.featured {
  background: linear-gradient(135deg, #1f8a70, #2e695d);
  color: #fff;
}

.quick-card.featured .quick-eyebrow,
.quick-card.featured p {
  color: rgba(255, 255, 255, 0.78);
}

.quick-card h2 {
  margin: 8px 0 8px;
  font-size: 28px;
}

.quick-card p,
.data-card p,
.coach-card p {
  color: var(--learn-muted);
}

.flow-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
}

.flow-line span {
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 13px;
  font-weight: 800;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.3fr;
  gap: 18px;
  margin-top: 22px;
}

.data-card,
.coach-card {
  padding: 24px;
}

.data-card strong {
  display: block;
  margin-top: 8px;
  font-size: 34px;
}

.coach-card {
  background: linear-gradient(135deg, var(--learn-amber-soft), #fff);
}

.coach-card h2 {
  margin: 14px 0 8px;
}

@media (max-width: 940px) {
  .home-hero,
  .quick-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    min-height: auto;
    padding: 28px;
  }
}

@media (max-width: 560px) {
  .home-page {
    width: min(100% - 20px, 1180px);
  }

  .panel-top,
  .mission-item {
    grid-template-columns: 1fr;
  }

  .panel-top {
    display: grid;
  }
}
</style>
