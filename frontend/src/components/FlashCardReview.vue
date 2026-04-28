<template>
  <section class="flash-review">
    <div class="review-overview">
      <article class="overview-card primary">
        <span>待复习</span>
        <strong>{{ totalWords }}</strong>
        <p>{{ currentWord ? `当前第 ${currentIndex + 1} 张` : '今天没有待复习单词' }}</p>
      </article>
      <article class="overview-card">
        <span>已完成</span>
        <strong>{{ stats.reviewed }}</strong>
        <p>本轮已经提交的卡片</p>
      </article>
      <article class="overview-card">
        <span>准确率</span>
        <strong>{{ accuracy }}%</strong>
        <p>{{ stats.reviewed ? '根据本轮反馈计算' : '完成后自动更新' }}</p>
      </article>
      <article class="overview-card">
        <span>连对</span>
        <strong>{{ streakCount }}</strong>
        <p>答错会重新计数</p>
      </article>
    </div>

    <div class="review-stage learn-card">
      <div class="stage-top">
        <div>
          <span class="stage-label">复习进度</span>
          <strong>{{ progressLabel }}</strong>
        </div>
        <button class="text-button" type="button" :disabled="loading" @click="loadReviewWords">
          {{ loading ? '刷新中' : '刷新词卡' }}
        </button>
      </div>

      <div class="learn-progress">
        <span :style="{ width: progressPercentage + '%' }"></span>
      </div>

      <div v-if="loading" class="state-panel">
        <strong>正在整理复习卡片</strong>
        <p>稍等一下，系统正在读取今天需要巩固的单词。</p>
      </div>

      <div v-else-if="showSummary" class="summary-panel">
        <span class="stage-label">本轮完成</span>
        <h2>复习结束，记忆状态已经更新。</h2>
        <div class="summary-grid">
          <div>
            <strong>{{ stats.reviewed }}</strong>
            <span>已复习</span>
          </div>
          <div>
            <strong>{{ stats.correct }}</strong>
            <span>掌握</span>
          </div>
          <div>
            <strong>{{ stats.incorrect }}</strong>
            <span>需再练</span>
          </div>
        </div>
        <div class="summary-actions">
          <button class="learn-button" type="button" @click="continueReview">继续复习</button>
          <button class="learn-button secondary" type="button" @click="goHome">回到首页</button>
        </div>
      </div>

      <div v-else-if="currentWord" class="card-workspace">
        <div class="word-meta-row">
          <span :class="['status-pill', statusClass(currentWord.status)]">
            {{ statusText(currentWord.status) }}
          </span>
          <span>已复习 {{ currentWord.reviewCounts || 0 }} 次</span>
          <span v-if="currentWord.nextReviewTime">下次复习 {{ formatDate(currentWord.nextReviewTime) }}</span>
        </div>

        <button class="flashcard" type="button" :class="{ flipped: isFlipped }" @click="toggleCard">
          <span class="card-side-label">{{ isFlipped ? '释义' : '单词' }}</span>
          <span v-if="!isFlipped" class="word-text">{{ currentWord.word }}</span>
          <span v-if="!isFlipped && currentWord.phonetic_symbol" class="phonetic">
            {{ currentWord.phonetic_symbol }}
          </span>
          <span v-if="!isFlipped" class="tap-hint">点击查看释义和例句</span>

          <span v-else class="meaning-block">
            <strong>{{ currentWord.meaning || currentWord.mean || currentWord.definition || '暂无释义' }}</strong>
            <small>{{ currentWord.example || '暂无例句，可以先凭记忆判断掌握程度。' }}</small>
          </span>
        </button>

        <div v-if="isFlipped && currentWord && !hasUsableExample(currentWord.example)" class="example-tools">
          <span>{{ exampleError || '这个词还没有可用例句，可以让 AI 补一条并保存。' }}</span>
          <button
            class="text-button"
            type="button"
            :disabled="generatingExample"
            @click="generateExampleForCurrent"
          >
            {{ generatingExample ? '生成中...' : '生成例句' }}
          </button>
        </div>

        <div class="memory-actions" :class="{ disabled: !isFlipped || submitting }">
          <button
            v-for="difficulty in difficultyLevels"
            :key="difficulty.value"
            type="button"
            class="difficulty-button"
            :class="difficulty.class"
            :disabled="!isFlipped || submitting"
            @click="submitReview(difficulty.value)"
          >
            <strong>{{ difficulty.label }}</strong>
            <span>{{ difficulty.hint }}</span>
          </button>
        </div>

        <div class="card-nav">
          <button type="button" class="learn-button secondary" :disabled="currentIndex === 0" @click="prevCard">
            上一张
          </button>
          <button type="button" class="learn-button secondary" :disabled="currentIndex >= words.length - 1" @click="skipCard">
            稍后再看
          </button>
        </div>
      </div>

      <div v-else class="state-panel">
        <strong>暂时没有待复习单词</strong>
        <p>当前没有到期的复习任务。可以回到今日任务继续推进新内容。</p>
        <div class="summary-actions">
          <button class="learn-button secondary" type="button" @click="loadReviewWords">重新检查</button>
          <button class="learn-button" type="button" @click="goHome">回到首页</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReviewWords, submitWordReview } from '@/api/word'
import { generateWordExample } from '@/api/wordExample'

const router = useRouter()

const words = ref([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const showSummary = ref(false)
const loading = ref(false)
const submitting = ref(false)
const generatingExample = ref(false)
const exampleError = ref('')
const streakCount = ref(0)
const stats = ref({ reviewed: 0, correct: 0, incorrect: 0 })

const difficultyLevels = [
  { value: 0, label: '很难', hint: '完全想不起', class: 'hard' },
  { value: 1, label: '较难', hint: '需要提示', class: 'medium-hard' },
  { value: 2, label: '一般', hint: '有点模糊', class: 'medium' },
  { value: 3, label: '较易', hint: '基本掌握', class: 'easy-medium' },
  { value: 4, label: '很易', hint: '秒懂', class: 'easy' }
]

const currentWord = computed(() => words.value[currentIndex.value])
const totalWords = computed(() => words.value.length)
const progressPercentage = computed(() => {
  if (!totalWords.value) return 0
  return Math.round((stats.value.reviewed / totalWords.value) * 100)
})
const progressLabel = computed(() => {
  if (!totalWords.value) return '0 / 0'
  return `${Math.min(stats.value.reviewed + 1, totalWords.value)} / ${totalWords.value}`
})
const accuracy = computed(() => {
  if (!stats.value.reviewed) return 0
  return Math.round((stats.value.correct / stats.value.reviewed) * 100)
})

onMounted(loadReviewWords)

function toggleCard() {
  isFlipped.value = !isFlipped.value
  exampleError.value = ''
}

function hasUsableExample(example) {
  return Boolean(example && example.trim() && example.trim() !== '暂无例句')
}

async function generateExampleForCurrent(event) {
  event?.stopPropagation()
  const word = currentWord.value
  const wordId = word?.wordId || word?._id || word?.id
  if (!word || !wordId || generatingExample.value) return

  try {
    generatingExample.value = true
    exampleError.value = ''
    const response = await generateWordExample(wordId)
    const example = response.data?.data?.example || ''
    if (response.data?.code !== 200 || !hasUsableExample(example)) {
      throw new Error(response.data?.message || '例句生成失败')
    }
    word.example = example
  } catch (error) {
    console.error('生成例句失败:', error)
    exampleError.value = '例句生成失败，请稍后再试。'
  } finally {
    generatingExample.value = false
  }
}

async function submitReview(difficulty) {
  const word = currentWord.value
  if (!word || submitting.value) return

  try {
    submitting.value = true
    const isCorrect = difficulty >= 3
    const newStatus = isCorrect ? 'know' : 'unknown'
    const response = await submitWordReview({
      wordId: word.wordId || word._id || word.id,
      word: word.word,
      isCorrect,
      newStatus
    })

    if (response.data.code !== 200) {
      throw new Error(response.data.message || '提交失败')
    }

    word.status = newStatus
    stats.value.reviewed += 1
    if (isCorrect) {
      stats.value.correct += 1
      streakCount.value += 1
    } else {
      stats.value.incorrect += 1
      streakCount.value = 0
    }

    goNextAfterSubmit()
  } catch (error) {
    console.error('提交复习结果失败:', error)
  } finally {
    submitting.value = false
  }
}

function goNextAfterSubmit() {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value += 1
    isFlipped.value = false
    exampleError.value = ''
    return
  }

  showSummary.value = true
}

function skipCard() {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value += 1
    isFlipped.value = false
    exampleError.value = ''
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    isFlipped.value = false
    exampleError.value = ''
  }
}

async function loadReviewWords() {
  try {
    loading.value = true
    const response = await getReviewWords()
    if (response.data.code === 200) {
      words.value = response.data.data?.words || []
      currentIndex.value = 0
      isFlipped.value = false
      exampleError.value = ''
      showSummary.value = false
      stats.value = { reviewed: 0, correct: 0, incorrect: 0 }
      streakCount.value = 0
    } else {
      words.value = []
    }
  } catch (error) {
    console.error('获取复习单词失败:', error)
    words.value = []
  } finally {
    loading.value = false
  }
}

function continueReview() {
  loadReviewWords()
}

function goHome() {
  router.push('/')
}

function statusText(status) {
  const labels = {
    know: '已掌握',
    unknown: '待加强',
    vague: '模糊',
    learning: '学习中',
    new: '新词'
  }
  return labels[status] || '待复习'
}

function statusClass(status) {
  if (status === 'know') return 'known'
  if (status === 'unknown') return 'weak'
  return 'learning'
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.flash-review {
  display: grid;
  gap: 18px;
}

.review-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  padding: 18px;
  border: 1px solid var(--learn-line);
  border-radius: 20px;
  background: rgba(255, 253, 247, 0.94);
  box-shadow: var(--learn-shadow-soft);
}

.overview-card.primary {
  background: linear-gradient(135deg, var(--learn-primary), #2d6d60);
  color: #fff;
}

.overview-card span,
.stage-label,
.word-meta-row,
.card-side-label {
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

.overview-card.primary span,
.overview-card.primary p {
  color: rgba(255, 255, 255, 0.78);
}

.overview-card strong {
  display: block;
  margin: 5px 0 2px;
  font-size: 32px;
  line-height: 1;
}

.overview-card p {
  margin: 0;
  color: var(--learn-muted);
  font-size: 13px;
}

.review-stage {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.stage-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.stage-top strong {
  display: block;
  margin-top: 4px;
  font-size: 22px;
}

.text-button {
  border: 0;
  background: transparent;
  color: var(--learn-primary-dark);
  font-weight: 900;
  cursor: pointer;
}

.text-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.card-workspace {
  display: grid;
  gap: 16px;
}

.word-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.status-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--learn-blue-soft);
  color: #2b5f99;
}

.status-pill.known {
  background: var(--learn-green-soft);
  color: var(--learn-primary-dark);
}

.status-pill.weak {
  background: var(--learn-coral-soft);
  color: var(--learn-coral);
}

.flashcard {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 14px;
  min-height: 340px;
  width: 100%;
  padding: clamp(28px, 5vw, 56px);
  border: 1px solid rgba(31, 138, 112, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(223, 243, 232, 0.9), rgba(255, 241, 207, 0.68)),
    #fffdf7;
  color: var(--learn-ink);
  cursor: pointer;
  box-shadow: var(--learn-shadow-soft);
  text-align: center;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.flashcard:hover {
  border-color: rgba(31, 138, 112, 0.34);
  transform: translateY(-2px);
  box-shadow: var(--learn-shadow);
}

.word-text {
  font-size: clamp(48px, 9vw, 92px);
  font-weight: 950;
  line-height: 0.98;
}

.phonetic {
  color: var(--learn-primary-dark);
  font-size: 20px;
  font-weight: 800;
}

.tap-hint {
  color: var(--learn-muted);
  font-size: 14px;
  font-weight: 800;
}

.meaning-block {
  display: grid;
  max-width: 760px;
  gap: 16px;
}

.meaning-block strong {
  font-size: clamp(28px, 5vw, 46px);
  line-height: 1.18;
}

.meaning-block small {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  color: var(--learn-muted);
  font-size: 16px;
  line-height: 1.6;
  text-align: left;
}

.example-tools {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px dashed rgba(31, 138, 112, 0.28);
  border-radius: 16px;
  background: rgba(255, 253, 247, 0.78);
  color: var(--learn-muted);
  font-size: 14px;
  font-weight: 800;
}

.example-tools .text-button {
  flex: 0 0 auto;
}

.memory-actions {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  transition: opacity 0.18s ease;
}

.memory-actions.disabled {
  opacity: 0.55;
}

.difficulty-button {
  display: grid;
  gap: 4px;
  min-height: 78px;
  padding: 12px;
  border: 1px solid var(--learn-line);
  border-radius: 16px;
  background: #fff;
  color: var(--learn-ink);
  cursor: pointer;
  text-align: left;
}

.difficulty-button strong {
  font-size: 16px;
}

.difficulty-button span {
  color: var(--learn-muted);
  font-size: 12px;
}

.difficulty-button.hard {
  border-color: rgba(233, 104, 91, 0.26);
  background: var(--learn-coral-soft);
}

.difficulty-button.medium,
.difficulty-button.medium-hard {
  background: var(--learn-amber-soft);
}

.difficulty-button.easy,
.difficulty-button.easy-medium {
  background: var(--learn-green-soft);
}

.difficulty-button:disabled {
  cursor: not-allowed;
}

.card-nav,
.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.state-panel,
.summary-panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  min-height: 360px;
  padding: 40px 20px;
  text-align: center;
  align-content: center;
}

.state-panel strong,
.summary-panel h2 {
  max-width: 620px;
  margin: 0;
  font-size: clamp(26px, 4vw, 42px);
  line-height: 1.16;
}

.state-panel p {
  max-width: 520px;
  margin: 0;
  color: var(--learn-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: min(520px, 100%);
}

.summary-grid div {
  padding: 16px;
  border-radius: 18px;
  background: #fff;
}

.summary-grid strong {
  display: block;
  font-size: 30px;
}

.summary-grid span {
  color: var(--learn-muted);
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 860px) {
  .review-overview,
  .memory-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .review-stage {
    padding: 14px;
  }

  .review-overview,
  .memory-actions,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .stage-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .flashcard {
    min-height: 300px;
    border-radius: 22px;
  }

  .meaning-block small {
    text-align: center;
  }

  .example-tools {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }
}
</style>
