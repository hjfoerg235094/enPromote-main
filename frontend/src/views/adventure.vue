<template>
  <div class="adventure-container" :class="getChapterThemeClass()">
    <div class="adventure-map" v-if="currentView === 'map'">
      <section class="console-hero">
        <div class="console-copy">
          <span class="eyebrow">当前场景训练台</span>
          <h1>{{ currentChapterMeta.name }}</h1>
          <p>{{ currentChapterMeta.description }}</p>
          <div class="hero-tags">
            <span>{{ currentChapterMeta.category }}</span>
            <span>{{ completedLevels }}/5 已完成</span>
            <span v-if="isChapterCompleted">剧情挑战已解锁</span>
            <span v-else>下一关：{{ nextPlayableLevel.title }}</span>
          </div>
        </div>

        <div class="next-card">
          <div class="next-card-top">
            <span>推荐下一步</span>
            <strong>{{ isChapterCompleted ? '复盘或进入剧情实战' : nextPlayableLevel.title }}</strong>
          </div>
          <p>{{ isChapterCompleted ? '你已完成全部能力关卡，可以进入角色剧情挑战，或回到任意关卡重练。' : nextPlayableLevel.goal }}</p>
          <div class="progress-meter" aria-label="当前场景总进度">
            <div class="progress-meter-fill" :style="{ width: overallProgress + '%' }"></div>
          </div>
          <div class="hero-actions">
            <button class="learn-button primary" @click="startNextLevel">
              {{ isChapterCompleted ? '重练实战对话' : `开始${nextPlayableLevel.title}` }}
            </button>
            <button class="learn-button secondary" @click="goToChapterSelection">返回场景库</button>
          </div>
        </div>
      </section>

      <section class="route-section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">训练路线</span>
            <h2>先打基础，再进入真实表达</h2>
          </div>
          <p>{{ completedLevels }}/5 关卡完成</p>
        </div>

        <div class="training-route">
          <article
            v-for="step in levelSteps"
            :key="step.key"
            class="training-step"
            :class="getLevelCardClass(step.key)"
            @click="enterLevel(step.key)"
          >
            <div class="step-index">{{ step.order }}</div>
            <div class="step-main">
              <div class="step-title-row">
                <h3>{{ step.title }}</h3>
                <span class="status-pill">{{ getLevelStateText(step.key) }}</span>
              </div>
              <p>{{ step.goal }}</p>
              <div class="step-meta">
                <span>{{ step.estimate }}</span>
                <span v-if="!isLevelUnlocked(step.key)">先完成{{ getPreviousLevelTitle(step.key) }}</span>
                <span v-else>{{ isLevelCompleted(step.key) ? '可重新练习' : '可进入' }}</span>
              </div>
            </div>
            <button class="step-action" :disabled="!isLevelUnlocked(step.key)">
              {{ getLevelActionText(step.key) }}
            </button>
          </article>
        </div>
      </section>

      <section class="story-unlock" :class="{ unlocked: isChapterCompleted }">
        <div>
          <span class="eyebrow">{{ isChapterCompleted ? '角色剧情已解锁' : '剧情挑战' }}</span>
          <h2>{{ isChapterCompleted ? '进入角色剧情实战' : '完成实战对话后解锁剧情挑战' }}</h2>
          <p>{{ isChapterCompleted ? '把刚练过的词汇、听力和表达放进完整剧情里使用。' : '角色剧情是主线训练后的应用奖励，不和基础关卡抢入口。' }}</p>
        </div>
        <button class="learn-button primary" :disabled="!isChapterCompleted" @click="goToStory">
          {{ isChapterCompleted ? '进入剧情挑战' : '尚未解锁' }}
        </button>
      </section>
    </div>

    <div class="level-content" v-if="currentView === 'level-wordP'">
      <div class="level-shell-header">
        <button class="back-btn" @click="backToMap">返回训练台</button>
        <div class="level-shell-copy">
          <span class="eyebrow">{{ currentChapterMeta.name }}</span>
          <h2>01 词汇学习</h2>
          <p>认识本场景核心词汇，并标记熟悉程度。</p>
        </div>
        <div class="mini-progress">{{ completedLevels }}/5</div>
      </div>

      <!-- 使用词汇练习组件 -->
      <VocabularyPractice v-if="!showLevelComplete" :words="vocabularyWords" :currentIndex="currentWordIndex"
        @know="handleKnow" @vague="handleVague" @unknown="handleUnknown" @next="handleNext"
        @complete="handleVocabularyComplete" />
      <div class="level-complete" v-if="showLevelComplete">
        <span class="complete-icon">完成</span>
        <h3>词汇学习完成</h3>
        <p>你已经学习了 {{ vocabularyWords.length }} 个场景词汇，可以进入拼写练习巩固记忆。</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ knownWords }}</span>
            <span class="stat-label">认识</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ vagueWords }}</span>
            <span class="stat-label">模糊</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ unknownWords }}</span>
            <span class="stat-label">不认识</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="nextLevel">下一关</button>
          <button class="btn-secondary" @click="backToMap">返回训练台</button>
          <button class="btn-secondary" @click="goToReviewReport">去复盘</button>
        </div>
      </div>
    </div>

    <div class="level-content" v-if="currentView === 'level-spellP'">
      <div class="level-shell-header">
        <button class="back-btn" @click="backToMap">返回训练台</button>
        <div class="level-shell-copy">
          <span class="eyebrow">{{ currentChapterMeta.name }}</span>
          <h2>02 拼写练习</h2>
          <p>根据中文释义和发音，拼写出正确的单词。</p>
        </div>
        <div class="mini-progress">{{ completedLevels }}/5</div>
      </div>

      <SpellingPractice v-if="!showSpellingComplete" :words="spellingWords" :startIndex="0"
        @complete="handleSpellingComplete" @next="handleSpellingNext" @correct="handleSpellingCorrect"
        @incorrect="handleSpellingIncorrect" />

      <div class="level-complete" v-if="showSpellingComplete">
        <span class="complete-icon">完成</span>
        <h3>拼写练习完成</h3>
        <p>你已经练习了 {{ spellingWords.length }} 个单词，下一步可以通过听力训练建立声音记忆。</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ correctSpellings }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ incorrectSpellings }}</span>
            <span class="stat-label">错误</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="nextLevel">下一关</button>
          <button class="btn-secondary" @click="backToMap">返回训练台</button>
          <button class="btn-secondary" @click="goToReviewReport">去复盘</button>
        </div>
      </div>
    </div>

    <div class="level-content" v-if="currentView === 'level-listenP'">
      <div class="level-shell-header">
        <button class="back-btn" @click="backToMap">返回训练台</button>
        <div class="level-shell-copy">
          <span class="eyebrow">{{ currentChapterMeta.name }}</span>
          <h2>03 听力训练</h2>
          <p>听单词发音，根据听到的内容拼写出正确的单词。</p>
        </div>
        <div class="mini-progress">{{ completedLevels }}/5</div>
      </div>

      <ListeningPractice v-if="!showListeningComplete" :words="listeningWords" @complete="handleListeningComplete"
        @correct="handleListeningCorrect" @incorrect="handleListeningIncorrect" />

      <div class="level-complete" v-if="showListeningComplete">
        <span class="complete-icon">完成</span>
        <h3>听力训练完成</h3>
        <p>你已经完成了 {{ listeningStats.total }} 个听力练习，下一步进入 AI 题目检验掌握度。</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ listeningStats.correct }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ listeningStats.total - listeningStats.correct }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ listeningStats.accuracy }}%</span>
            <span class="stat-label">准确率</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="nextLevel">下一关</button>
          <button class="btn-secondary" @click="backToMap">返回训练台</button>
          <button class="btn-secondary" @click="goToReviewReport">去复盘</button>
        </div>
      </div>
    </div>

    <div class="level-content" v-if="currentView === 'level-customsP'">
      <div class="level-shell-header">
        <button class="back-btn" @click="backToMap">返回训练台</button>
        <div class="level-shell-copy">
          <span class="eyebrow">{{ currentChapterMeta.name }}</span>
          <h2>04 AI 题目</h2>
          <p>AI 根据你的学习情况生成个性化题目，检验学习效果。</p>
        </div>
        <div class="mini-progress">{{ completedLevels }}/5</div>
      </div>

      <AIQuestionPractice v-if="!showAIQuestionComplete" :positionType="currentPositionType" :wordList="aiQuestionWords"
        :preloadedQuestions="preloadedAIQuestions" :usePreloaded="isAIQuestionsPreloaded"
        @complete="handleAIQuestionComplete" @correct="handleAIQuestionCorrect" @incorrect="handleAIQuestionIncorrect"
        @answer="handleAIQuestionAnswer" @questionsGenerated="handleQuestionsGenerated" />

      <div class="level-complete" v-if="showAIQuestionComplete">
        <span class="complete-icon">完成</span>
        <h3>AI 题目完成</h3>
        <p>你已经完成 {{ aiQuestionStats.total }} 道题目，最后进入实战对话。</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ aiQuestionStats.correct }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ aiQuestionStats.total - aiQuestionStats.correct }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ aiQuestionStats.accuracy }}%</span>
            <span class="stat-label">准确率</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="nextLevel">下一关</button>
          <button class="btn-secondary" @click="backToMap">返回训练台</button>
          <button class="btn-secondary" @click="goToReviewReport">去复盘</button>
        </div>
      </div>
    </div>

    <div class="level-content" v-if="currentView === 'level-coverP'">
      <div class="level-shell-header" v-if="!showAIChatComplete">
        <button class="back-btn" @click="backToMap">返回训练台</button>
        <div class="level-shell-copy">
          <span class="eyebrow">{{ currentChapterMeta.name }}</span>
          <h2>05 实战对话</h2>
          <p>把词汇、听力和表达放进真实情境里使用。</p>
        </div>
        <div class="mini-progress">{{ completedLevels }}/5</div>
      </div>

      <AIChatPractice v-if="!showAIChatComplete" :chapter="currentChapter" @complete="handleAIChatComplete"
        @exit="handleAIChatExit" />

      <div class="level-complete" v-if="showAIChatComplete">
        <span class="complete-icon">完成</span>
        <h3>实战对话完成</h3>
        <p>你已经完成当前场景全部训练，角色剧情挑战已解锁。</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ aiChatStats.messageCount }}</span>
            <span class="stat-label">总消息数</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ aiChatStats.userMessages }}</span>
            <span class="stat-label">你的消息</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ aiChatStats.aiMessages }}</span>
            <span class="stat-label">AI回复</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="goToStory">进入剧情挑战</button>
          <button class="btn-secondary" @click="backToMap">返回训练台</button>
          <button class="btn-secondary" @click="goToReviewReport">去复盘</button>
        </div>
      </div>
    </div>

    <AIQuestionLoadingModal :visible="showAILoadingModal" @continue="handleAILoadingContinue"
      @close="handleAILoadingContinue" ref="aiLoadingModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserInfo, changeInfo, switchChapter } from '@/api/auth'
import { useRoute, useRouter } from 'vue-router'
import { getReviewWords } from '@/api/word'
import { toast } from '@/utils/toastService'

import VocabularyPractice from '@/components/VocabularyPracticeNew.vue'
import SpellingPractice from '@/components/SpellingPractice.vue'
import ListeningPractice from '@/components/ListeningPractice.vue'
import AIQuestionPractice from '@/components/AIQuestionPractice.vue'
import AIChatPractice from '@/components/AIChatPractice.vue'
import AIQuestionLoadingModal from '@/components/AIQuestionLoadingModal.vue'

// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const currentView = ref('map')
const userInfo = ref(null)
const currentChapter = ref('A') // 当前章节
const chapters = ref({
  A: { name: '酒店场景', scenario: 'hotel', color: '#4A90E2' },
  B: { name: '餐厅场景', scenario: 'restaurant', color: '#F5A623' }
})

const levelSteps = [
  {
    key: 'wordP',
    order: '01',
    title: '词汇学习',
    goal: '认识本场景核心词汇，建立第一层语义记忆。',
    estimate: '约 6 分钟'
  },
  {
    key: 'spellP',
    order: '02',
    title: '拼写练习',
    goal: '用拼写把词义和词形绑定起来，减少看得懂但写不出的情况。',
    estimate: '约 7 分钟'
  },
  {
    key: 'listenP',
    order: '03',
    title: '听力训练',
    goal: '通过发音识别词汇，为真实对话做准备。',
    estimate: '约 6 分钟'
  },
  {
    key: 'customsP',
    order: '04',
    title: 'AI 题目',
    goal: '用个性化题目检查掌握情况，定位还不稳定的表达。',
    estimate: '约 8 分钟'
  },
  {
    key: 'coverP',
    order: '05',
    title: '实战对话',
    goal: '在完整场景里开口表达，把训练内容真正用出来。',
    estimate: '约 10 分钟'
  }
]

const chapterMetaFallback = {
  A: {
    name: '酒店场景训练',
    category: '旅行出行',
    description: '围绕入住、咨询、需求沟通和退房表达，完成从词汇到实战对话的 5 步训练。'
  },
  B: {
    name: '餐厅场景训练',
    category: '餐饮购物',
    description: '练习点餐、询问口味、处理服务问题和结账表达，最后进入真实对话应用。'
  }
}

// 词汇练习相关数据
const vocabularyWords = ref([])
const currentWordIndex = ref(0)
const showMeaning = ref(false)
const showLevelComplete = ref(false)
const knownWords = ref(0)
const vagueWords = ref(0)
const unknownWords = ref(0)

// 拼写练习相关数据
const spellingWords = ref([])
const showSpellingComplete = ref(false)
const correctSpellings = ref(0)
const incorrectSpellings = ref(0)
const spellingStartTime = ref(null)

// 听力练习相关数据
const listeningWords = ref([])
const showListeningComplete = ref(false)
const listeningStats = ref({ total: 0, correct: 0, accuracy: 0 })
const listeningStartTime = ref(null)

// AI题目练习相关数据
const aiQuestionWords = ref([])
const showAIQuestionComplete = ref(false)
const aiQuestionStats = ref({ total: 0, correct: 0, accuracy: 0 })
const currentPositionType = ref('')

// 第五关：AI对话相关数据
const showAIChatComplete = ref(false)
const aiChatStats = ref({ messageCount: 0, userMessages: 0, aiMessages: 0 })

// AI题目预加载相关
const showAILoadingModal = ref(false)
const preloadedAIQuestions = ref(null)
const aiQuestionAnswers = ref([]) // 存储用户答题记录
const isAIQuestionsPreloaded = ref(false)

// 计算属性
const currentVocabularyWord = computed(() => {
  return vocabularyWords.value[currentWordIndex.value]
})

const vocabularyProgress = computed(() => {
  if (vocabularyWords.value.length === 0) return 0
  return (currentWordIndex.value / vocabularyWords.value.length) * 100
})

// 答题记录统计
const answerStats = computed(() => {
  const answers = aiQuestionAnswers.value
  const total = answers.length
  const correct = answers.filter(a => a.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return {
    total,
    correct,
    incorrect: total - correct,
    accuracy
  }
})

const overallProgress = computed(() => {
  if (!userInfo.value || !userInfo.value.chapters) return 0

  // 如果有多章节数据，使用当前章节的进度
  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    if (chapterProgress) {
      let completed = 0
      if (chapterProgress.wordP) completed++
      if (chapterProgress.spellP) completed++
      if (chapterProgress.listenP) completed++
      if (chapterProgress.customsP) completed++
      if (chapterProgress.coverP) completed++
      return (completed / 5) * 100
    }
  }

  // 兼容旧数据结构
  const cet4 = userInfo.value.cet4
  let completed = 0
  if (cet4.wordP) completed++
  if (cet4.spellP) completed++
  if (cet4.listenP) completed++
  if (cet4.customsP) completed++
  if (cet4.coverP) completed++
  return (completed / 5) * 100
})

const completedLevels = computed(() => {
  if (!userInfo.value) return 0

  // 如果有多章节数据，使用当前章节的进度
  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    if (chapterProgress) {
      let completed = 0
      if (chapterProgress.wordP) completed++
      if (chapterProgress.spellP) completed++
      if (chapterProgress.listenP) completed++
      if (chapterProgress.customsP) completed++
      if (chapterProgress.coverP) completed++
      return completed
    }
  }

  // 兼容旧数据结构
  const cet4 = userInfo.value.cet4
  let completed = 0
  if (cet4.wordP) completed++
  if (cet4.spellP) completed++
  if (cet4.listenP) completed++
  if (cet4.customsP) completed++
  if (cet4.coverP) completed++
  return completed
})

const currentChapterId = computed(() => userInfo.value?.currentChapter || currentChapter.value || 'A')

const currentChapterMeta = computed(() => {
  const id = currentChapterId.value
  const chapter = chapters.value[id] || {}
  const fallback = chapterMetaFallback[id] || {
    name: chapter.name ? `${chapter.name}训练` : '当前场景训练',
    category: '场景任务',
    description: '按照词汇、拼写、听力、AI 题目和实战对话完成当前场景训练。'
  }

  return {
    ...fallback,
    ...chapter,
    name: fallback.name || chapter.name || '当前场景训练'
  }
})

const isChapterCompleted = computed(() => completedLevels.value >= levelSteps.length)

const nextPlayableLevel = computed(() => {
  if (!userInfo.value) return levelSteps[0]
  return levelSteps.find(step => !isLevelCompleted(step.key) && isLevelUnlocked(step.key)) || levelSteps[levelSteps.length - 1]
})

// 方法
const isLevelCompleted = (level) => {
  if (!userInfo.value) return false

  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    return Boolean(chapterProgress && chapterProgress[level])
  }

  const cet4 = userInfo.value.cet4
  return Boolean(cet4 && cet4[level])
}

const getPreviousLevelTitle = (level) => {
  const index = levelSteps.findIndex(step => step.key === level)
  if (index <= 0) return '上一关'
  return levelSteps[index - 1].title
}

const getLevelStateText = (level) => {
  if (isLevelCompleted(level)) return '已完成'
  if (nextPlayableLevel.value.key === level && isLevelUnlocked(level)) return '当前建议'
  if (isLevelUnlocked(level)) return '可进入'
  return '未解锁'
}

const getLevelActionText = (level) => {
  if (!isLevelUnlocked(level)) return '锁定'
  if (isLevelCompleted(level)) return '重练'
  return nextPlayableLevel.value.key === level ? '开始' : '进入'
}

const getLevelCardClass = (level) => {
  return {
    completed: isLevelCompleted(level),
    current: nextPlayableLevel.value.key === level && !isLevelCompleted(level),
    locked: !isLevelUnlocked(level)
  }
}

const isLevelUnlocked = (level) => {
  if (!userInfo.value) return false

  // 优先使用多章节数据
  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    if (chapterProgress) {
      if (level === 'wordP') return true // 第一关总是解锁的
      if (level === 'spellP') return chapterProgress.wordP // 第二关需要完成第一关
      if (level === 'listenP') return chapterProgress.spellP // 第三关需要完成第二关
      if (level === 'customsP') return chapterProgress.listenP // 第四关需要完成第三关
      if (level === 'coverP') return chapterProgress.customsP // 第五关需要完成第四关
      return false
    }
  }

  // 兼容旧数据结构
  const cet4 = userInfo.value.cet4
  if (level === 'wordP') return true // 第一关总是解锁的
  if (level === 'spellP') return cet4.wordP // 第二关需要完成第一关
  if (level === 'listenP') return cet4.spellP // 第三关需要完成第二关
  if (level === 'customsP') return cet4.listenP // 第四关需要完成第三关
  if (level === 'coverP') return cet4.customsP // 第五关需要完成第四关

  return false
}

const enterLevel = (level) => {
  if (!isLevelUnlocked(level)) return

  if (level === 'wordP') {
    startVocabularyPractice()
  } else if (level === 'spellP') {
    startSpellingPractice()
  } else if (level === 'listenP') {
    startListeningPractice()
  } else if (level === 'customsP') {
    startAIQuestionPractice()
  } else if (level === 'coverP') {
    startAIChatPractice()
  }
}

const backToMap = () => {
  currentView.value = 'map'
  resetVocabularyPractice()
}

const startVocabularyPractice = async () => {
  try {
    // 使用当前章节获取单词列表
    const currentChapter = userInfo.value.currentChapter || 'A'
    
    // 获取用户当前的学习进度
    const progressResponse = await fetch('/api/word/getWordProgress')
    const progressData = await progressResponse.json()
    
    let startIndex = 0
    if (progressData.code === 200 && progressData.data) {
      // 从用户进度中解析当前字母和索引
      const position = progressData.data
      const parts = position.split(':')
      if (parts.length === 2) {
        startIndex = parseInt(parts[1]) || 0
      }
    }
    
    // 获取单词列表，使用当前进度作为起始索引
    const response = await fetch(`/api/word/getWordList?chapter=${currentChapter}&index=${startIndex}`)
    const data = await response.json()

    if (data.code === 200) {
      vocabularyWords.value = data.data.words || []
      
      // 如果获取的单词为空，使用index=0再尝试一次
      if (vocabularyWords.value.length === 0) {
        const fallbackResponse = await fetch(`/api/word/getWordList?chapter=${currentChapter}&index=0`)
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.code === 200) {
          vocabularyWords.value = fallbackData.data.words || []
        }
      }
      
      currentWordIndex.value = 0
      showMeaning.value = false
      showLevelComplete.value = false
      knownWords.value = 0
      vagueWords.value = 0
      unknownWords.value = 0
      currentView.value = 'level-wordP'
    }
  } catch (error) {
    console.error('获取单词列表失败:', error)
  }
}

const resetVocabularyPractice = () => {
  vocabularyWords.value = []
  currentWordIndex.value = 0
  showMeaning.value = false
  showLevelComplete.value = false
}

const startSpellingPractice = async () => {
  try {
    // 使用当前章节获取单词列表
    const currentChapter = userInfo.value.currentChapter || 'A'

    // 获取单词列表（复用词汇练习的单词）
    const response = await fetch(`/api/word/getWordList?chapter=${currentChapter}&index=0`)
    const data = await response.json()

    if (data.code === 200) {
      spellingWords.value = data.data.words || []
      showSpellingComplete.value = false
      correctSpellings.value = 0
      incorrectSpellings.value = 0
      spellingStartTime.value = new Date()
      currentView.value = 'level-spellP'
    }
  } catch (error) {
    console.error('获取拼写单词列表失败:', error)
  }
}

const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value
}

const handleKnow = (index) => {
  knownWords.value++
}

const handleVague = (index) => {
  vagueWords.value++
}

const handleUnknown = (index) => {
  unknownWords.value++
}

const handleNext = (index) => {
  currentWordIndex.value = index
}

const handleVocabularyComplete = async (stats) => {
  console.log('词汇练习完成:', stats)

  // 如果有统计数据，更新计数
  if (stats) {
    knownWords.value = stats.knownWords || knownWords.value
    vagueWords.value = stats.vagueWords || vagueWords.value
    unknownWords.value = stats.unknownWords || unknownWords.value
  }

  // 记录学习活动到StudyRecord，使用实际的学习时长
  const studyTime = stats.studyTime || 0; // 使用前端记录的实际学习时长
  const totalWords = stats.wordsCount || vocabularyWords.value.length || 0
  const recognizedWords = knownWords.value || 0
  const recognitionAccuracy = totalWords > 0 ? (recognizedWords / totalWords) * 100 : 0
  if (studyTime > 0) {
    try {
      await fetch('/api/report/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: 'vocabulary',
          studyTime: studyTime,
          newWords: totalWords,
          reviewWords: 0,
          accuracy: recognitionAccuracy,
          startTime: new Date(Date.now() - studyTime * 60 * 1000),
          endTime: new Date()
        })
      });
      console.log('学习活动记录成功，学习时长:', studyTime, '分钟');
    } catch (error) {
      console.error('记录学习活动失败:', error);
    }
  }

  // 更新用户学习进度
  try {
    // 获取当前进度
    console.log('开始获取当前学习进度...')
    const progressResponse = await fetch('/api/word/getWordProgress')
    
    if (!progressResponse.ok) {
      console.error('获取学习进度请求失败，状态码:', progressResponse.status)
      return
    }
    
    const progressData = await progressResponse.json()
    console.log('获取到的学习进度数据:', progressData)

    if (progressData.code === 200 && progressData.data) {
      // 解析当前位置
      const position = progressData.data
      const parts = position.split(':')
      if (parts.length === 2) {
        const letter = parts[0]
        let index = parseInt(parts[1]) || 0
        console.log(`当前位置: ${letter}:${index}, 将增加 ${vocabularyWords.value.length} 个单词`)

        // 增加已学习的单词数量
        index += vocabularyWords.value.length

        // 更新进度
        console.log('开始更新学习进度...')
        const updateResponse = await fetch('/api/word/updateWordProgress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studyWords: vocabularyWords.value.length,
            skipStudyRecord: true
          })
        })

        if (!updateResponse.ok) {
          console.error('更新学习进度请求失败，状态码:', updateResponse.status)
          return
        }
        
        const updateData = await updateResponse.json()
        console.log('更新学习进度响应数据:', updateData)
        
        if (updateData.code === 200) {
          console.log('学习进度更新成功')
        } else {
          console.error('学习进度更新失败:', updateData.message)
        }
      } else {
        console.error('学习进度格式错误:', position)
      }
    } else {
      console.error('获取学习进度失败:', progressData.message || '未知错误')
    }
  } catch (error) {
    console.error('更新学习进度出错:', error)
  }

  // 显示第一关完成提示，然后预加载AI题目
  await showFirstLevelCompleteAndPreload()
}

// 第一关完成后的预加载流程
const showFirstLevelCompleteAndPreload = async () => {
  // 显示第一关完成的提示
  toast.success(`🎉 第一关完成！认识：${knownWords.value}个，模糊：${vagueWords.value}个，不认识：${unknownWords.value}个`)

  // 开始预加载AI题目
  await startAIQuestionPreload()
  // 完成第一关
  await completeLevel('wordP')
}

// 预加载AI题目
const startAIQuestionPreload = async () => {
  showAILoadingModal.value = true

  try {
    // 使用当前章节而不是cet4.position
    const currentChapter = userInfo.value?.currentChapter || 'A'

    // 获取复习单词列表
    const { data: wordData } = await getReviewWords()
    const wordList = wordData.code === 200 ? (wordData.data.words || []) : []

    // 确保有单词列表，否则使用默认单词
    if (wordList.length === 0) {
      console.warn('没有复习单词，使用默认单词列表')
      // 可以添加一些默认单词或者从其他接口获取
    }

    console.log('预加载AI题目 - Chapter:', currentChapter, 'wordList length:', wordList.length)

    // 调用AI题目生成接口
    const response = await fetch('/api/question/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapter: currentChapter,
        level: 4,
        aiProvider: 'aliyun'
      })
    })

    const data = await response.json()

    console.log('AI题目生成响应:', data)

    if (data.code === 200) {
      // 存储预加载的题目
      preloadedAIQuestions.value = data.data
      isAIQuestionsPreloaded.value = true

      // 保存到localStorage，防止页面刷新丢失
      localStorage.setItem('preloadedAIQuestions', JSON.stringify({
        data: data.data,
        chapter: currentChapter.value,
        timestamp: Date.now()
      }))

      console.log('✅ AI题目预加载成功:', data.data)
      console.log('✅ 预加载状态更新:', {
        isAIQuestionsPreloaded: isAIQuestionsPreloaded.value,
        hasQuestions: !!preloadedAIQuestions.value,
        questionsCount: data.data?.fill_in_the_blanks?.length || 0
      })

      // 模拟加载时间，让用户看到加载过程
      setTimeout(() => {
        completeAIQuestionPreload()
      }, 4000) // 4秒后完成

    } else {
      console.error('AI题目生成失败:', data)
      showAILoadingModal.value = false
      toast.error(`AI题目生成失败: ${data.message || '未知错误'}`)
    }

  } catch (error) {
    console.error('预加载AI题目失败:', error)
    showAILoadingModal.value = false
    toast.error('网络错误，请检查连接后重试')
  }
}

// 完成AI题目预加载
const completeAIQuestionPreload = () => {
  showAILoadingModal.value = false
  // 显示惊喜提示
  setTimeout(() => {
    toast.success('🎉 太棒了！AI已经为您生成了专属的场景练习题目，快去第四关体验吧！')
  }, 500)
}

// 处理加载窗口的继续按钮
const handleAILoadingContinue = () => {
  completeAIQuestionPreload()
}

const recordPracticeReport = async ({ module, startTime, wordsCount, accuracy }) => {
  const endTime = new Date()
  const fallbackMinutes = wordsCount > 0 ? Math.max(1, Math.ceil(wordsCount / 3)) : 0
  const actualMinutes = startTime ? (endTime.getTime() - startTime.getTime()) / 1000 / 60 : 0
  const studyTime = actualMinutes > 0 ? Math.max(0.1, Math.round(actualMinutes * 100) / 100) : fallbackMinutes

  if (studyTime <= 0) return

  try {
    await fetch('/api/report/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module,
        studyTime,
        newWords: 0,
        reviewWords: 0,
        accuracy,
        startTime: startTime || new Date(endTime.getTime() - studyTime * 60 * 1000),
        endTime
      })
    })
  } catch (error) {
    console.error(`记录${module}练习报告失败:`, error)
  }
}

const handleSpellingComplete = async () => {
  const total = correctSpellings.value + incorrectSpellings.value
  const accuracy = total > 0 ? Math.round((correctSpellings.value / total) * 100) : 0

  await recordPracticeReport({
    module: 'spelling',
    startTime: spellingStartTime.value,
    wordsCount: total || spellingWords.value.length,
    accuracy
  })

  // 完成第二关
  showSpellingComplete.value = true
  await completeLevel('spellP')
}

const handleSpellingNext = (index) => {
  // 处理拼写练习下一个单词
}

const handleSpellingCorrect = (index) => {
  correctSpellings.value++
  console.log('correctSpellings=' + correctSpellings.value);

}

const handleSpellingIncorrect = (index) => {
  incorrectSpellings.value++
  console.log('incorrectSpellings=' + incorrectSpellings.value);

}

const startListeningPractice = async () => {
  try {
    // 获取需要听力练习的单词
    const { data } = await getReviewWords()

    if (data.code === 200) {
      // 限制听力练习单词数量，最多20个
      const words = data.data.words || []
      listeningWords.value = words.slice(0, 20)
      
      // 如果API返回的单词为空，使用示例单词
      if (listeningWords.value.length === 0) {
        listeningWords.value = [
          { word: "hello", mean: "你好" },
          { word: "world", mean: "世界" },
          { word: "apple", mean: "苹果" },
          { word: "computer", mean: "电脑" },
          { word: "language", mean: "语言" },
          { word: "practice", mean: "练习" },
          { word: "listen", mean: "听" },
          { word: "speak", mean: "说" },
          { word: "read", mean: "读" },
          { word: "write", mean: "写" }
        ]
      }
      
      showListeningComplete.value = false
      listeningStats.value = { total: 0, correct: 0, accuracy: 0 }
      listeningStartTime.value = new Date()
      currentView.value = 'level-listenP'
    }
  } catch (error) {
    console.error('获取听力单词列表失败:', error)
    
    // 如果API调用失败，使用示例单词
    listeningWords.value = [
      { word: "hello", mean: "你好" },
      { word: "world", mean: "世界" },
      { word: "apple", mean: "苹果" },
      { word: "computer", mean: "电脑" },
      { word: "language", mean: "语言" },
      { word: "practice", mean: "练习" },
      { word: "listen", mean: "听" },
      { word: "speak", mean: "说" },
      { word: "read", mean: "读" },
      { word: "write", mean: "写" }
    ]
    
    showListeningComplete.value = false
    listeningStats.value = { total: 0, correct: 0, accuracy: 0 }
    listeningStartTime.value = new Date()
    currentView.value = 'level-listenP'
  }
}

const handleListeningComplete = async (stats) => {
  listeningStats.value = stats
  await recordPracticeReport({
    module: 'listening',
    startTime: listeningStartTime.value,
    wordsCount: stats?.total || listeningWords.value.length,
    accuracy: stats?.accuracy || 0
  })
  showListeningComplete.value = true
  await completeLevel('listenP')
}

const handleListeningCorrect = (index) => {
  // 听力练习正确处理
}

const handleListeningIncorrect = (index) => {
  // 听力练习错误处理
}

const startAIQuestionPractice = async () => {
  try {
    console.log('启动AI题目练习 - 检查预加载状态:')
    console.log('isAIQuestionsPreloaded:', isAIQuestionsPreloaded.value)
    console.log('preloadedAIQuestions:', preloadedAIQuestions.value)

    // 使用当前章节而不是cet4.position
    const currentChapter = userInfo.value?.currentChapter || 'A'
    currentPositionType.value = currentChapter

    // 优先使用预加载的题目
    if (isAIQuestionsPreloaded.value && preloadedAIQuestions.value) {
      console.log('✅ 使用预加载的AI题目')
      showAIQuestionComplete.value = false
      aiQuestionStats.value = { total: 0, correct: 0, accuracy: 0 }
      currentView.value = 'level-customsP'
      return
    }

    // 检查localStorage中是否有预加载的题目
    const savedQuestions = localStorage.getItem('preloadedAIQuestions')
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions)
        // 检查是否是当前章节的题目，且不超过1小时
        if (parsed.chapter === currentChapter.value &&
          (Date.now() - parsed.timestamp) < 3600000) {
          preloadedAIQuestions.value = parsed.data
          isAIQuestionsPreloaded.value = true
          console.log('使用localStorage中的预加载题目')
          showAIQuestionComplete.value = false
          aiQuestionStats.value = { total: 0, correct: 0, accuracy: 0 }
          currentView.value = 'level-customsP'
          return
        }
      } catch (e) {
        console.error('解析localStorage题目失败:', e)
      }
    }

    // 如果没有预加载题目，实时生成
    console.log('实时生成AI题目')

    // 获取复习单词列表用于AI生成题目
    const { data } = await getReviewWords()

    if (data.code === 200) {
      aiQuestionWords.value = data.data.words || []
      showAIQuestionComplete.value = false
      aiQuestionStats.value = { total: 0, correct: 0, accuracy: 0 }
      currentView.value = 'level-customsP'
    }
  } catch (error) {
    console.error('获取AI题目单词列表失败:', error)
  }
}

const handleAIQuestionComplete = async (stats) => {
  aiQuestionStats.value = stats
  showAIQuestionComplete.value = true
  await completeLevel('customsP')
}

const handleAIQuestionCorrect = (index) => {
  // AI题目练习正确处理
}

const handleAIQuestionIncorrect = (index) => {
  // AI题目练习错误处理
}

// 处理AI题目答题记录
const handleAIQuestionAnswer = (answerData) => {
  // 存储用户答题记录
  aiQuestionAnswers.value.push({
    questionIndex: answerData.questionIndex,
    selectedAnswer: answerData.selectedAnswer,
    correctAnswer: answerData.correctAnswer,
    isCorrect: answerData.isCorrect,
    timestamp: Date.now()
  })

  // 保存到localStorage
  const savedAnswers = JSON.parse(localStorage.getItem('aiQuestionAnswers') || '[]')
  savedAnswers.push({
    ...answerData,
    chapter: currentChapter.value,
    timestamp: Date.now()
  })
  localStorage.setItem('aiQuestionAnswers', JSON.stringify(savedAnswers))

  console.log('答题记录已保存:', answerData)
  console.log('📊 当前答题统计:', answerStats.value)
}

// 处理AI题目生成完成事件
const handleQuestionsGenerated = (questionsData) => {
  console.log('🎯 收到AI题目生成完成通知:', questionsData)

  // 将实时生成的题目也存储到localStorage，就像预加载题目一样
  localStorage.setItem('preloadedAIQuestions', JSON.stringify({
    data: questionsData.data,
    chapter: questionsData.chapter || currentChapter.value,
    timestamp: questionsData.timestamp
  }))

  // 更新本地状态
  preloadedAIQuestions.value = questionsData.data
  isAIQuestionsPreloaded.value = true

  console.log('✅ 实时生成的AI题目已存储到localStorage')
}

const startAIChatPractice = () => {
  showAIChatComplete.value = false
  aiChatStats.value = { messageCount: 0, userMessages: 0, aiMessages: 0 }
  currentView.value = 'level-coverP'
}

const handleAIChatComplete = async (stats) => {
  // 只有真正完成任务时才标记为完成
  if (stats.completed) {
    aiChatStats.value = stats
    showAIChatComplete.value = true
    await completeLevel('coverP')
  } else {
    // 如果没有完成，只是退出到地图
    aiChatStats.value = stats
    backToMap()
  }
}

const handleAIChatExit = (stats) => {
  // 用户主动退出对话，不算完成，直接返回地图
  console.log('用户主动退出AI对话，未完成任务')
  aiChatStats.value = stats || {
    messageCount: 0,
    userMessages: 0,
    aiMessages: 0,
    completed: false
  }
  backToMap()
}

const completeLevel = async (level) => {
  try {
    console.log(`🎯 完成关卡: ${level}`)

    // 更新用户进度
    await changeInfo({ [level]: true })

    // 刷新用户信息
    await loadUserInfo()

    console.log(`✅ 关卡 ${level} 完成状态已更新`)

    if (level === 'wordP') {
      showLevelComplete.value = true
    }
  } catch (error) {
    console.error('更新关卡进度失败:', error)
  }
}

const nextLevel = () => {
  const currentIndex = levelSteps.findIndex(step => currentView.value === `level-${step.key}`)
  const nextStep = levelSteps[currentIndex + 1]

  if (nextStep && isLevelUnlocked(nextStep.key)) {
    enterLevel(nextStep.key)
    return
  }

  backToMap()
}

const loadUserInfo = async () => {
  try {
    const response = await getUserInfo()
    const data = response.data || response // 兼容处理
    if (data) {
      userInfo.value = data

      // 设置当前章节
      if (data.currentChapter) {
        currentChapter.value = data.currentChapter
      }

      console.log('🔄 用户信息已更新:', userInfo.value)
      console.log('📍 当前章节:', currentChapter.value)

      // 调试章节进度信息
      if (data.chapters && data.currentChapter) {
        const chapterProgress = data.chapters[data.currentChapter]
        console.log(`📊 ${data.currentChapter}章节进度:`, chapterProgress)
      }

      // 调试旧数据结构（如果存在）
      if (data.cet4) {
        console.log('🔧 CET4数据:', data.cet4)
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 切换章节
const switchToChapter = async (chapter) => {
  try {
    const response = await switchChapter(chapter)
    const data = response.data || response
    if (data.code === 200) {
      currentChapter.value = chapter
      // 刷新用户信息
      await loadUserInfo()
    }
  } catch (error) {
    console.error('切换章节失败:', error)
  }
}

// 跳转到章节选择页面
const goToChapterSelection = () => {
  router.push('/chapters')
}

const startNextLevel = () => {
  if (nextPlayableLevel.value?.key) {
    enterLevel(nextPlayableLevel.value.key)
  }
}

const goToStory = () => {
  if (!isChapterCompleted.value) return
  router.push('/story')
}

const goToReviewReport = () => {
  router.push('/review-ai-chat')
}

// 获取章节主题类
const getChapterThemeClass = () => {
  const chapter = userInfo.value?.currentChapter || currentChapter.value || 'A'
  return `theme-${chapter.toLowerCase()}`
}

// 检查localStorage中的预加载题目
const checkPreloadedQuestions = () => {
  try {
    const savedQuestions = localStorage.getItem('preloadedAIQuestions')
    if (savedQuestions) {
      const parsed = JSON.parse(savedQuestions)
      // 检查是否是当前章节的题目，且不超过1小时
      if (parsed.chapter === currentChapter.value &&
        (Date.now() - parsed.timestamp) < 3600000) {
        preloadedAIQuestions.value = parsed.data
        isAIQuestionsPreloaded.value = true
        console.log('发现localStorage中的预加载题目')
      } else {
        // 清除过期的题目
        localStorage.removeItem('preloadedAIQuestions')
        console.log('清除过期的预加载题目')
      }
    }
  } catch (error) {
    console.error('检查预加载题目失败:', error)
    localStorage.removeItem('preloadedAIQuestions')
  }
}

// 检查localStorage中的答题记录
const checkSavedAnswers = () => {
  try {
    const savedAnswers = localStorage.getItem('aiQuestionAnswers')
    if (savedAnswers) {
      const parsed = JSON.parse(savedAnswers)
      // 过滤当前章节的答题记录
      const currentChapterAnswers = parsed.filter(answer =>
        answer.chapter === currentChapter.value
      )
      aiQuestionAnswers.value = currentChapterAnswers
      console.log(`恢复了 ${currentChapterAnswers.length} 条答题记录`)
    }
  } catch (error) {
    console.error('检查答题记录失败:', error)
    localStorage.removeItem('aiQuestionAnswers')
  }
}

// 页面加载时获取用户信息
onMounted(async () => {
  await loadUserInfo()

  // 检查预加载题目
  checkPreloadedQuestions()

  // 检查答题记录
  checkSavedAnswers()

  // 检查路由参数，支持直接进入特定关卡
  const levelParam = route.query.level
  const chapterParam = route.query.chapter

  if (levelParam && chapterParam) {
    // 如果章节不同，先切换章节
    if (chapterParam !== currentChapter.value) {
      await switchToChapter(chapterParam)
    }
    // 直接进入指定关卡
    enterLevel(levelParam)
  }
})
</script>

<style scoped>
.adventure-container {
  min-height: 100vh;
  padding: 20px;
  position: relative;
  transition: all 0.5s ease;
}

/* 默认背景 */
.adventure-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 酒店场景主题 - 蓝色商务风格 */
.adventure-container.theme-a {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #4a90e2 50%, #667eea 75%, #764ba2 100%);
  background-size: 400% 400%;
  animation: hotelGradient 20s ease infinite;
}

.adventure-container.theme-a::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

@keyframes hotelGradient {
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

/* 餐厅场景主题 - 暖色美食风格 */
.adventure-container.theme-b {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #f368e0 75%, #ff6348 100%);
  background-size: 400% 400%;
  animation: restaurantGradient 18s ease infinite;
}

.adventure-container.theme-b::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 30% 70%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(238, 90, 36, 0.2) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

@keyframes restaurantGradient {
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

.adventure-map {
  max-width: 800px;
  margin: 0 auto;
}

.map-header {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(90, 103, 216, 0.4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-content {
  text-align: center;
  flex: 1;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}

.current-chapter {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.chapter-label {
  font-size: 0.95rem;
  opacity: 1;
  font-weight: 600;
  color: #ffffff;
}

.chapter-name {
  font-size: 1.2rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.35);
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.chapter-switch-btn {
  background: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.chapter-switch-btn:hover {
  background: rgba(255, 255, 255, 0.45);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.map-title {
  font-size: 2.2rem;
  margin-bottom: 0.6rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.map-subtitle {
  font-size: 1.1rem;
  color: #ffffff;
  opacity: 0.95;
  font-weight: 500;
}

.levels-container {
  margin-bottom: 2rem;
}

.level-path {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}

.level-node {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  min-width: 170px;
  text-align: center;
  cursor: pointer;
  position: relative;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.level-node:hover:not(.locked) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  border-color: #667eea;
}

.level-node.completed {
  background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(46, 125, 50, 0.4);
  border: 2px solid #1b5e20;
}

.level-node.current {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  color: #ffffff;
  box-shadow: 0 8px 25px rgba(90, 103, 216, 0.5);
  transform: scale(1.05);
  border: 2px solid #4c51bf;
}

.level-node.locked {
  opacity: 0.7;
  cursor: not-allowed;
  background: #e2e8f0;
  border: 2px solid #cbd5e0;
}

.level-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.level-title {
  font-size: 1rem;
  margin-bottom: 0.3rem;
  font-weight: 700;
  color: #2d3748;
}

.level-name {
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  color: #4a5568;
  font-weight: 500;
}

.level-progress {
  font-size: 0.85rem;
  font-weight: 600;
  color: #667eea;
}

.level-status {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.level-connector {
  width: 50px;
  height: 4px;
  background: #cbd5e0;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.level-connector.unlocked {
  background: linear-gradient(90deg, #2e7d32, #43a047);
  box-shadow: 0 0 10px rgba(46, 125, 50, 0.5);
}

.overall-progress {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.overall-progress h3 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.progress-bar {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  height: 20px;
  margin: 0.8rem 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-fill {
  background: linear-gradient(90deg, #2e7d32, #43a047);
  height: 100%;
  border-radius: 10px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(46, 125, 50, 0.5);
}

.overall-progress p {
  font-size: 1.1rem;
  margin: 0;
  color: #ffffff;
  font-weight: 600;
}

.level-content {
  max-width: 700px;
  margin: 0 auto;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 2.5rem;
  color: #ffffff;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.back-btn {
  background: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.45);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.vocabulary-practice,
.spelling-practice {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.practice-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.practice-progress .progress-bar {
  flex: 1;
  background: #f0f0f0;
  height: 6px;
  border-radius: 3px;
}

.practice-progress .progress-fill {
  background: #667eea;
  height: 100%;
  border-radius: 3px;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.word-card {
  text-align: center;
  margin-bottom: 2rem;
}

.word-text {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.phonetic {
  color: #666;
  margin-bottom: 1rem;
}

.hint-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  margin-bottom: 1rem;
}

.hint-btn.active {
  background: #4CAF50;
}

.meaning-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 80px;
}

.know-btn {
  background: #4CAF50;
  color: white;
}

.vague-btn {
  background: #FF9800;
  color: white;
}

.unknown-btn {
  background: #f44336;
  color: white;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-complete {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  animation: bounce 1s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.level-complete h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}

.level-complete p {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.complete-stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #5a67d8;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.95rem;
  color: #4a5568;
  font-weight: 600;
}

.complete-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-primary {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  color: #ffffff;
  border: none;
  padding: 12px 28px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(90, 103, 216, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(90, 103, 216, 0.5);
}

.btn-secondary {
  background: transparent;
  color: #5a67d8;
  border: 2px solid #5a67d8;
  padding: 10px 26px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: rgba(90, 103, 216, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(90, 103, 216, 0.3);
}

.placeholder-content {
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .adventure-container {
    padding: 1rem;
  }

  .map-header {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .chapter-info {
    align-items: center;
  }

  .current-chapter {
    align-items: center;
  }

  .level-path {
    flex-direction: column;
    gap: 1rem;
  }

  .level-connector {
    width: 3px;
    height: 30px;
    transform: rotate(90deg);
  }

  .action-buttons {
    flex-direction: column;
  }
}

.adventure-container {
  min-height: 100vh;
  padding: 28px clamp(16px, 3vw, 40px);
  background:
    radial-gradient(circle at 16% 8%, rgba(247, 196, 83, 0.16), transparent 28%),
    linear-gradient(180deg, var(--learn-surface-soft, #f6f2e8) 0%, #fffaf0 100%) !important;
  color: var(--learn-ink, #20312d);
}

.adventure-container::before {
  display: none !important;
}

.adventure-map {
  width: min(1120px, 100%);
  max-width: none;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.console-hero,
.route-section,
.story-unlock,
.level-shell-header,
.level-complete {
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 50px rgba(52, 70, 57, 0.12);
}

.console-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
  gap: 24px;
  align-items: stretch;
  padding: clamp(22px, 4vw, 42px);
  border-radius: 26px;
}

.console-copy h1 {
  margin: 8px 0 12px;
  color: var(--learn-ink, #20312d);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.05;
  letter-spacing: 0;
}

.console-copy p,
.next-card p,
.story-unlock p,
.section-heading p,
.step-main p,
.level-shell-copy p,
.level-complete p {
  color: var(--learn-muted, #65736f);
}

.hero-tags,
.step-meta,
.complete-actions,
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-tags span,
.status-pill,
.step-meta span,
.mini-progress,
.eyebrow,
.complete-icon {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: 999px;
  font-weight: 800;
}

.eyebrow {
  color: var(--learn-accent, #2f7d5c);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.hero-tags span,
.step-meta span {
  min-height: 30px;
  padding: 6px 11px;
  background: var(--learn-surface-soft, #f6f2e8);
  color: var(--learn-muted, #65736f);
  font-size: 0.84rem;
}

.next-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(246, 242, 232, 0.92), rgba(255, 255, 255, 0.94));
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
}

.next-card-top {
  display: grid;
  gap: 6px;
}

.next-card-top span {
  color: var(--learn-muted, #65736f);
  font-size: 0.86rem;
  font-weight: 700;
}

.next-card-top strong {
  color: var(--learn-ink, #20312d);
  font-size: 1.5rem;
}

.progress-meter {
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(32, 49, 45, 0.1);
}

.progress-meter-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--learn-accent, #2f7d5c), var(--learn-warm, #f3b23d));
  transition: width 0.35s ease;
}

.learn-button,
.btn-primary,
.btn-secondary,
.back-btn,
.step-action {
  min-height: 42px;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0 18px;
  cursor: pointer;
  font-weight: 800;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.learn-button.primary,
.btn-primary {
  background: var(--learn-accent, #2f7d5c);
  color: #fff;
  box-shadow: 0 12px 24px rgba(47, 125, 92, 0.22);
}

.learn-button.secondary,
.btn-secondary,
.back-btn {
  background: #fff;
  color: var(--learn-ink, #20312d);
  border-color: var(--learn-border, rgba(32, 49, 45, 0.14));
  box-shadow: none;
}

.learn-button:hover:not(:disabled),
.btn-primary:hover,
.btn-secondary:hover,
.back-btn:hover,
.step-action:hover:not(:disabled) {
  transform: translateY(-2px);
}

.learn-button:disabled,
.step-action:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.route-section,
.story-unlock {
  margin-top: 22px;
  padding: clamp(18px, 3vw, 28px);
  border-radius: 24px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-heading h2,
.story-unlock h2 {
  margin: 6px 0 0;
  color: var(--learn-ink, #20312d);
  font-size: clamp(1.3rem, 2vw, 1.8rem);
}

.training-route {
  display: grid;
  gap: 12px;
}

.training-step {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  cursor: pointer;
}

.training-step.current {
  border-color: rgba(47, 125, 92, 0.42);
  background: rgba(235, 248, 241, 0.82);
}

.training-step.completed {
  background: rgba(245, 252, 247, 0.9);
}

.training-step.locked {
  cursor: not-allowed;
  background: rgba(244, 244, 240, 0.72);
}

.step-index {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--learn-surface-soft, #f6f2e8);
  color: var(--learn-accent, #2f7d5c);
  font-weight: 900;
}

.training-step.completed .step-index {
  background: rgba(47, 125, 92, 0.12);
}

.training-step.locked .step-index {
  color: #9aa39f;
}

.step-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
}

.step-title-row h3 {
  margin: 0;
  color: var(--learn-ink, #20312d);
  font-size: 1.08rem;
}

.status-pill {
  min-height: 28px;
  padding: 5px 10px;
  background: rgba(47, 125, 92, 0.1);
  color: var(--learn-accent, #2f7d5c);
  font-size: 0.8rem;
}

.training-step.locked .status-pill {
  background: rgba(32, 49, 45, 0.08);
  color: #7d8884;
}

.step-main p {
  margin: 0 0 10px;
  line-height: 1.55;
}

.step-action {
  background: var(--learn-ink, #20312d);
  color: #fff;
}

.step-action:disabled {
  background: #d8ddd9;
  color: #68736f;
}

.story-unlock {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.story-unlock.unlocked {
  border-color: rgba(243, 178, 61, 0.5);
  background: linear-gradient(135deg, rgba(255, 248, 231, 0.94), rgba(255, 255, 255, 0.92));
}

.level-content {
  width: min(1040px, 100%);
  max-width: none;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.level-shell-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 22px;
}

.level-shell-copy h2 {
  margin: 2px 0 4px;
  color: var(--learn-ink, #20312d);
  font-size: clamp(1.2rem, 2vw, 1.7rem);
}

.level-shell-copy p {
  margin: 0;
}

.mini-progress,
.complete-icon {
  padding: 7px 12px;
  background: rgba(47, 125, 92, 0.1);
  color: var(--learn-accent, #2f7d5c);
}

.level-complete {
  width: min(680px, 100%);
  margin: 26px auto 0;
  padding: clamp(22px, 4vw, 34px);
  border-radius: 24px;
}

.level-complete h3 {
  margin: 14px 0 8px;
  color: var(--learn-ink, #20312d);
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.complete-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 12px;
  margin: 22px 0;
  padding: 14px;
  background: var(--learn-surface-soft, #f6f2e8);
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
  border-radius: 18px;
}

.stat-number {
  color: var(--learn-accent, #2f7d5c);
}

.complete-actions {
  justify-content: center;
  margin-top: 18px;
}

@media (max-width: 820px) {
  .console-hero {
    grid-template-columns: 1fr;
  }

  .section-heading,
  .story-unlock {
    align-items: flex-start;
    flex-direction: column;
  }

  .training-step {
    grid-template-columns: 46px minmax(0, 1fr);
  }

  .step-action {
    grid-column: 1 / -1;
    width: 100%;
  }

  .level-shell-header {
    grid-template-columns: 1fr;
  }

  .back-btn,
  .mini-progress {
    width: fit-content;
  }
}
</style>
