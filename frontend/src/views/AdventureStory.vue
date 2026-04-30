<template>
  <main class="learn-page adventure-page">
    <section class="adventure-hero">
      <div>
        <span class="learn-kicker">闯关学习</span>
        <h1>一条主线，两种训练节奏</h1>
        <!-- <p>主线闯关负责稳定推进能力，角色剧情负责把英语放进更沉浸的任务里。建议先完成闯关，再进入剧情应用。</p> -->
      </div>
      <div class="progress-summary learn-card">
        <span>当前进度</span>
        <strong>{{ completedChapters }}/{{ totalChapters }}</strong>
        <small>章节完成</small>
      </div>
    </section>

    <section class="mode-grid">
      <article class="mode-card primary" @click="goToAdventureMode">
        <div class="mode-badge">推荐主线</div>
        <h2>闯关学习</h2>
        <p>按词汇、拼写、听力、AI 题目、实战对话逐步推进，适合作为每日主任务。</p>
        <div class="mode-meta">
          <span>进度可视化</span>
          <span>目标明确</span>
          <span>适合每天 15 分钟</span>
        </div>
        <button class="learn-button" type="button">进入闯关</button>
      </article>

      <article class="mode-card" @click="goToStoryMode">
        <div class="mode-badge soft">沉浸应用</div>
        <h2>角色剧情</h2>
        <p>跟随剧情完成不同角色任务，把已学表达放进真实沟通场景。</p>
        <div class="mode-meta">
          <span>角色模拟</span>
          <span>剧情分支</span>
          <span>适合闯关后加练</span>
        </div>
        <button class="learn-button secondary" type="button">进入剧情</button>
      </article>
    </section>

    <section class="progress-grid">
      <article class="progress-card learn-card">
        <span>已完成任务</span>
        <strong>{{ completedTasks }}/{{ totalTasks }}</strong>
        <p>记录你的点滴进步，让努力清晰可见。</p>
      </article>
      <article class="progress-card learn-card">
        <span>累计学习</span>
        <strong>{{ formatTime(totalStudyTime) }}</strong>
        <p>保持轻量推进，比一次学很多更稳定。</p>
      </article>
      <article class="continue-card learn-card" v-if="currentChapter">
        <span>继续上次</span>
        <h2>{{ currentChapter.title }}</h2>
        <p>{{ currentChapter.description }}</p>
        <div class="learn-progress">
          <span :style="{ width: chapterProgress + '%' }"></span>
        </div>
        <button class="learn-button" type="button" @click="continueChapter">继续学习 {{ chapterProgressText }}</button>
      </article>
      <article class="continue-card learn-card" v-else>
        <span>下一步</span>
        <h2>选择一个场景开始</h2>
        <p>目前还没有可继续的章节，建议从酒店或餐厅主线进入第一关。</p>
        <button class="learn-button" type="button" @click="goToAdventureMode">选择场景</button>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const completedChapters = ref(0)
const totalChapters = ref(5)
const completedTasks = ref(0)
const totalTasks = ref(25)
const totalStudyTime = ref(0)
const currentChapter = ref(null)

const chapterProgress = computed(() => {
  if (!currentChapter.value?.tasks) return 0
  const completed = currentChapter.value.tasks.filter((task) => task.completed).length
  return Math.round((completed / currentChapter.value.tasks.length) * 100)
})

const chapterProgressText = computed(() => {
  if (!currentChapter.value?.tasks) return '0/0'
  const completed = currentChapter.value.tasks.filter((task) => task.completed).length
  return `${completed}/${currentChapter.value.tasks.length}`
})

const formatTime = (minutes) => {
  if (!minutes) return '0 分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`
}

const goToStoryMode = () => router.push('/story')
const goToAdventureMode = () => router.push('/chapters')

const continueChapter = () => {
  if (currentChapter.value) {
    router.push(`/chapter/${currentChapter.value.storyId}/${currentChapter.value.chapterId}`)
  }
}

const fetchProgressData = async () => {
  try {
    const progressRes = await axios.get('/api/user/progress')
    if (progressRes.data?.code === 200) {
      const data = progressRes.data.data
      completedChapters.value = data.completedChapters || 0
      completedTasks.value = data.completedTasks || 0
      totalStudyTime.value = data.totalStudyTime || 0
      currentChapter.value = data.currentChapter || null
    }
  } catch (error) {
    console.error('获取闯关进度失败:', error)
  }
}

onMounted(fetchProgressData)
</script>

<style scoped>
.adventure-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 20px;
}

.adventure-hero>div:first-child {
  padding: 34px;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(66, 119, 184, 0.12), rgba(31, 138, 112, 0.12)), #fffdf7;
  box-shadow: var(--learn-shadow-soft);
}

.adventure-hero h1 {
  margin: 16px 0 10px;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.08;
}

.adventure-hero p {
  max-width: 760px;
  margin: 0;
  color: var(--learn-muted);
}

.progress-summary {
  display: grid;
  align-content: center;
  padding: 24px;
}

.progress-summary span,
.progress-card span,
.continue-card span {
  color: var(--learn-muted);
  font-weight: 800;
}

.progress-summary strong {
  font-size: 44px;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  margin-bottom: 20px;
}

.mode-card {
  min-height: 310px;
  padding: 28px;
  border: 1px solid var(--learn-line);
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--learn-shadow-soft);
  cursor: pointer;
}

.mode-card.primary {
  background: linear-gradient(135deg, #1f8a70, #2d6d60);
  color: #fff;
}

.mode-card.primary p {
  color: rgba(255, 255, 255, 0.78);
}

.mode-badge {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-weight: 900;
}

.mode-badge.soft {
  background: var(--learn-amber-soft);
  color: #8a5a07;
}

.mode-card h2 {
  margin: 18px 0 8px;
  font-size: 32px;
}

.mode-card p,
.progress-card p,
.continue-card p {
  color: var(--learn-muted);
}

.mode-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0;
}

.mode-meta span {
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(36, 49, 47, 0.08);
  font-size: 13px;
  font-weight: 800;
}

.mode-card.primary .mode-meta span {
  background: rgba(255, 255, 255, 0.14);
}

.progress-grid {
  display: grid;
  grid-template-columns: 0.8fr 0.8fr 1.4fr;
  gap: 18px;
}

.progress-card,
.continue-card {
  padding: 24px;
}

.progress-card strong {
  display: block;
  margin-top: 8px;
  font-size: 32px;
}

.continue-card h2 {
  margin: 8px 0;
}

.continue-card .learn-progress {
  margin: 18px 0;
}

@media (max-width: 880px) {

  .adventure-hero,
  .mode-grid,
  .progress-grid {
    grid-template-columns: 1fr;
  }
}
</style>
