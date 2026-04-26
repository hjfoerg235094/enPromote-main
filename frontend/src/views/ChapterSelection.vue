<template>
  <main class="learn-page chapter-hall">
    <section class="hall-hero">
      <div>
        <span class="learn-kicker">闯关大厅</span>
        <h1>选择今天的场景任务</h1>
        <p>先完成 5 个能力关卡，再解锁角色剧情实战。当前主线负责行动，场景库负责探索。</p>
      </div>

      <div class="hall-summary learn-card">
        <span>当前主线</span>
        <strong>{{ currentChapterName }}</strong>
        <small>{{ totalCompletedSteps }}/{{ totalSteps }} 个训练环节已完成</small>
        <div class="learn-progress">
          <span :style="{ width: totalProgress + '%' }"></span>
        </div>
      </div>
    </section>

    <section class="recommend-strip learn-card">
      <div>
        <span>下一步推荐</span>
        <strong>{{ recommendedText }}</strong>
      </div>
      <button class="learn-button" type="button" @click="selectChapter(currentChapter)">
        继续当前主线
      </button>
    </section>

    <section class="recommend-section">
      <div class="section-title-row">
        <div>
          <span class="learn-kicker">今日推荐</span>
          <h2>先从这几个场景开始</h2>
        </div>
        <small>默认展示当前主线、未完成和新解锁场景，避免场景变多后铺满页面。</small>
      </div>

      <div class="recommend-grid">
        <article
          v-for="chapter in recommendedChapters"
          :key="chapter.id"
          class="recommend-card"
          :class="{ active: currentChapter === chapter.id }"
        >
          <span>{{ chapter.categoryLabel }}</span>
          <h3>{{ chapter.name }}</h3>
          <p>{{ getNextStep(chapter.id).name }} · {{ getChapterProgress(chapter.id) }}/{{ levelSteps.length }} 已完成</p>
          <button class="learn-button secondary" type="button" @click="selectChapter(chapter.id)">
            {{ currentChapter === chapter.id ? '继续' : '开始' }}
          </button>
        </article>
      </div>
    </section>

    <section class="library-section learn-card">
      <div class="library-header">
        <div>
          <span class="learn-kicker">场景库</span>
          <h2>按主题浏览</h2>
        </div>

        <div class="category-tabs" aria-label="场景分类">
          <button
            v-for="category in categories"
            :key="category.key"
            type="button"
            :class="{ active: selectedCategory === category.key }"
            @click="selectedCategory = category.key"
          >
            {{ category.label }}
            <span>{{ getCategoryCount(category.key) }}</span>
          </button>
        </div>
      </div>

      <div class="scene-grid">
        <article
          v-for="chapter in filteredChapters"
          :key="chapter.id"
          class="scene-card"
          :class="{ active: currentChapter === chapter.id, completed: isChapterCompleted(chapter.id) }"
        >
          <div class="scene-header">
            <div>
              <span class="scene-tag">{{ chapter.scenarioLabel }}</span>
              <h2>{{ chapter.name }}</h2>
            </div>
            <span v-if="currentChapter === chapter.id" class="current-pill">当前主线</span>
          </div>

          <p class="scene-description">{{ chapter.description }}</p>

          <div class="scene-meta">
            <div>
              <span>进度</span>
              <strong>{{ getChapterProgress(chapter.id) }}/{{ levelSteps.length }}</strong>
            </div>
            <div>
              <span>核心词汇</span>
              <strong>{{ chapter.vocabulary.length }} 个</strong>
            </div>
            <div>
              <span>下一关</span>
              <strong>{{ getNextStep(chapter.id).name }}</strong>
            </div>
          </div>

          <div class="word-preview">
            <span v-for="word in chapter.vocabulary" :key="word">{{ word }}</span>
          </div>

          <div class="step-chain" aria-label="五关训练进度">
            <div
              v-for="(step, index) in levelSteps"
              :key="step.key"
              class="step-node"
              :class="getStepClass(chapter.id, step.key, index)"
            >
              <span class="step-number">{{ index + 1 }}</span>
              <div>
                <strong>{{ step.name }}</strong>
                <small>{{ step.description }}</small>
              </div>
            </div>
          </div>

          <div class="story-unlock" :class="{ unlocked: isChapterCompleted(chapter.id) }">
            <div>
              <span>{{ isChapterCompleted(chapter.id) ? '剧情已解锁' : '剧情挑战' }}</span>
              <strong>
                {{ isChapterCompleted(chapter.id) ? `${chapter.storyTitle} 可进入` : '完成全部训练后解锁角色剧情' }}
              </strong>
            </div>
            <button
              class="story-button"
              type="button"
              :disabled="!isChapterCompleted(chapter.id)"
              @click.stop="goToStory"
            >
              {{ isChapterCompleted(chapter.id) ? '进入剧情' : '未解锁' }}
            </button>
          </div>

          <div class="scene-actions">
            <button class="learn-button" type="button" @click="selectChapter(chapter.id)">
              {{ currentChapter === chapter.id ? '继续学习' : '切换并开始' }}
            </button>
            <span>{{ getChapterProgress(chapter.id) === 0 ? '从词汇学习开始' : `继续：${getNextStep(chapter.id).name}` }}</span>
          </div>
        </article>
      </div>

      <div v-if="filteredChapters.length === 0" class="empty-library">
        <strong>这个分类暂时没有场景</strong>
        <p>后续新增场景时，只要配置分类，就会自动出现在这里。</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { switchChapter, getUserInfo } from '@/api/auth'
import { toast } from '@/utils/toastService'

const router = useRouter()
const userInfo = ref(null)
const currentChapter = ref('A')
const selectedCategory = ref('all')

const levelSteps = [
  { key: 'wordP', name: '词汇学习', description: '认识场景核心词' },
  { key: 'spellP', name: '拼写练习', description: '强化单词记忆' },
  { key: 'listenP', name: '听力训练', description: '听懂真实表达' },
  { key: 'customsP', name: 'AI 题目', description: '检查理解应用' },
  { key: 'coverP', name: '实战对话', description: '开口完成任务' }
]

const categories = [
  { key: 'all', label: '全部' },
  { key: 'travel', label: '旅行出行' },
  { key: 'food', label: '餐饮购物' },
  { key: 'work', label: '校园职场' },
  { key: 'life', label: '生活服务' },
  { key: 'completed', label: '已完成' }
]

const chapters = ref([
  {
    id: 'A',
    name: '酒店场景',
    category: 'travel',
    categoryLabel: '旅行出行',
    scenarioLabel: 'Hotel Mission',
    description: '练习入住登记、房间服务、退房结账等酒店沟通任务。',
    storyTitle: '深夜前台入住模拟',
    vocabulary: ['reception', 'check-in', 'reservation', 'lobby', 'checkout']
  },
  {
    id: 'B',
    name: '餐厅场景',
    category: 'food',
    categoryLabel: '餐饮购物',
    scenarioLabel: 'Restaurant Mission',
    description: '练习点餐、推荐菜品、确认忌口、结账等餐厅沟通任务。',
    storyTitle: '餐厅服务员角色挑战',
    vocabulary: ['menu', 'order', 'appetizer', 'dessert', 'bill']
  }
])

const totalSteps = computed(() => chapters.value.length * levelSteps.length)

const totalCompletedSteps = computed(() => {
  return chapters.value.reduce((sum, chapter) => sum + getChapterProgress(chapter.id), 0)
})

const totalProgress = computed(() => {
  if (!totalSteps.value) return 0
  return Math.round((totalCompletedSteps.value / totalSteps.value) * 100)
})

const currentChapterName = computed(() => {
  return chapters.value.find((chapter) => chapter.id === currentChapter.value)?.name || '酒店场景'
})

const recommendedText = computed(() => {
  const nextStep = getNextStep(currentChapter.value)
  if (isChapterCompleted(currentChapter.value)) return `${currentChapterName.value}已完成，角色剧情已解锁`
  return `${currentChapterName.value} · 下一关：${nextStep.name}`
})

const recommendedChapters = computed(() => {
  const current = chapters.value.find((chapter) => chapter.id === currentChapter.value)
  const unfinished = chapters.value
    .filter((chapter) => chapter.id !== currentChapter.value && !isChapterCompleted(chapter.id))
    .slice(0, 2)
  const completed = chapters.value
    .filter((chapter) => chapter.id !== currentChapter.value && isChapterCompleted(chapter.id))
    .slice(0, 1)
  return [current, ...unfinished, ...completed].filter(Boolean).slice(0, 4)
})

const filteredChapters = computed(() => {
  if (selectedCategory.value === 'all') return chapters.value
  if (selectedCategory.value === 'completed') {
    return chapters.value.filter((chapter) => isChapterCompleted(chapter.id))
  }
  return chapters.value.filter((chapter) => chapter.category === selectedCategory.value)
})

const getCategoryCount = (categoryKey) => {
  if (categoryKey === 'all') return chapters.value.length
  if (categoryKey === 'completed') return chapters.value.filter((chapter) => isChapterCompleted(chapter.id)).length
  return chapters.value.filter((chapter) => chapter.category === categoryKey).length
}

const getChapterData = (chapterId) => {
  return userInfo.value?.chapters?.[chapterId] || {}
}

const getChapterProgress = (chapterId) => {
  const chapterProgress = getChapterData(chapterId)
  return levelSteps.reduce((count, step) => count + (chapterProgress[step.key] ? 1 : 0), 0)
}

const isLevelCompleted = (chapterId, key) => {
  return Boolean(getChapterData(chapterId)[key])
}

const isChapterCompleted = (chapterId) => {
  return getChapterProgress(chapterId) === levelSteps.length
}

const getNextStep = (chapterId) => {
  const nextStep = levelSteps.find((step) => !isLevelCompleted(chapterId, step.key))
  return nextStep || { key: 'story', name: '角色剧情', description: '进入实战挑战' }
}

const getStepClass = (chapterId, key, index) => {
  const nextStep = getNextStep(chapterId)
  return {
    done: isLevelCompleted(chapterId, key),
    current: nextStep.key === key,
    locked: !isLevelCompleted(chapterId, key) && levelSteps.findIndex((step) => step.key === nextStep.key) < index
  }
}

const selectChapter = async (chapterId) => {
  try {
    const response = await switchChapter(chapterId)
    const data = response.data || response

    if (data.code === 200) {
      currentChapter.value = chapterId
      router.push('/adventure')
    } else {
      toast.error(data.message || '切换章节失败')
    }
  } catch (error) {
    console.error('切换章节错误:', error)
    toast.error('切换章节失败，请检查网络连接或重新登录')
  }
}

const goToStory = () => {
  router.push('/story')
}

const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo()
    const data = response.data || response

    if (data.code === 200) {
      userInfo.value = data
      currentChapter.value = data.currentChapter || 'A'
    } else {
      toast.error(data.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(fetchUserInfo)
</script>

<style scoped>
.chapter-hall {
  display: grid;
  gap: 20px;
}

.hall-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: stretch;
}

.hall-hero > div:first-child {
  padding: 34px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(31, 138, 112, 0.12), rgba(66, 119, 184, 0.12)),
    var(--learn-surface);
  box-shadow: var(--learn-shadow-soft);
}

.hall-hero h1 {
  margin: 16px 0 10px;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.08;
  letter-spacing: 0;
}

.hall-hero p,
.section-title-row small,
.scene-description,
.recommend-card p,
.empty-library p {
  color: var(--learn-muted);
}

.hall-summary {
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 24px;
}

.hall-summary span,
.recommend-strip span,
.scene-meta span,
.story-unlock span,
.recommend-card span {
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

.hall-summary strong {
  font-size: 32px;
}

.hall-summary small {
  color: var(--learn-muted);
}

.recommend-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
}

.recommend-strip strong {
  display: block;
  margin-top: 2px;
  font-size: 20px;
}

.recommend-section,
.library-section {
  display: grid;
  gap: 16px;
}

.section-title-row,
.library-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
}

.section-title-row h2,
.library-header h2 {
  margin: 10px 0 0;
  font-size: 28px;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.recommend-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--learn-line);
  border-radius: 22px;
  background: #fff;
  box-shadow: var(--learn-shadow-soft);
}

.recommend-card.active {
  background: var(--learn-green-soft);
  border-color: rgba(31, 138, 112, 0.28);
}

.recommend-card h3 {
  margin: 0;
  font-size: 22px;
}

.library-section {
  padding: 22px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.category-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  color: var(--learn-muted);
  font-weight: 900;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--learn-line);
}

.category-tabs button.active {
  background: var(--learn-ink);
  color: #fff;
}

.category-tabs span {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 12px;
}

.category-tabs button:not(.active) span {
  background: var(--learn-amber-soft);
  color: #8a5a07;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.scene-card {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--learn-line);
  border-radius: 30px;
  background: rgba(255, 253, 247, 0.92);
  box-shadow: var(--learn-shadow-soft);
}

.scene-card.active {
  border-color: rgba(31, 138, 112, 0.38);
  background:
    linear-gradient(180deg, rgba(223, 243, 232, 0.65), rgba(255, 253, 247, 0.92)),
    var(--learn-surface);
}

.scene-card.completed {
  border-color: rgba(240, 164, 58, 0.45);
}

.scene-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.scene-tag,
.current-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.scene-tag {
  background: var(--learn-blue-soft);
  color: var(--learn-blue);
}

.current-pill {
  flex: 0 0 auto;
  background: var(--learn-green-soft);
  color: var(--learn-primary-dark);
}

.scene-header h2 {
  margin: 10px 0 0;
  font-size: 30px;
}

.scene-description {
  margin: 0;
}

.scene-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.scene-meta div {
  padding: 14px;
  border-radius: 18px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(36, 49, 47, 0.07);
}

.scene-meta strong {
  display: block;
  margin-top: 4px;
}

.word-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.word-preview span {
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--learn-amber-soft);
  color: #8a5a07;
  font-size: 13px;
  font-weight: 800;
}

.step-chain {
  display: grid;
  gap: 10px;
}

.step-node {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--learn-line);
  border-radius: 18px;
  background: #fff;
  opacity: 0.72;
}

.step-node.done {
  opacity: 1;
  background: var(--learn-green-soft);
}

.step-node.current {
  opacity: 1;
  border-color: rgba(31, 138, 112, 0.32);
  box-shadow: 0 10px 24px rgba(31, 138, 112, 0.1);
}

.step-node.locked {
  opacity: 0.5;
}

.step-number {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: var(--learn-ink);
  color: #fff;
  font-weight: 900;
}

.step-node.done .step-number {
  background: var(--learn-primary);
}

.step-node.current .step-number {
  background: var(--learn-accent);
}

.step-node strong,
.step-node small {
  display: block;
}

.step-node small {
  color: var(--learn-muted);
}

.story-unlock {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border-radius: 20px;
  background: rgba(36, 49, 47, 0.06);
}

.story-unlock.unlocked {
  background: var(--learn-amber-soft);
}

.story-unlock strong {
  display: block;
  margin-top: 3px;
}

.story-button {
  flex: 0 0 auto;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--learn-ink);
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.story-button:disabled {
  background: rgba(36, 49, 47, 0.18);
  color: rgba(36, 49, 47, 0.52);
  cursor: not-allowed;
}

.scene-actions {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.scene-actions span {
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

.empty-library {
  padding: 28px;
  border-radius: 22px;
  background: var(--learn-amber-soft);
}

.empty-library strong {
  display: block;
  margin-bottom: 4px;
}

@media (max-width: 980px) {
  .hall-hero,
  .scene-grid,
  .recommend-grid {
    grid-template-columns: 1fr;
  }

  .section-title-row,
  .library-header {
    align-items: stretch;
    flex-direction: column;
  }

  .category-tabs {
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .recommend-strip,
  .scene-header,
  .story-unlock,
  .scene-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .scene-meta {
    grid-template-columns: 1fr;
  }
}
</style>
