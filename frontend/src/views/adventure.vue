<template>
  <div class="adventure-container" :class="getChapterThemeClass()">
    <!-- 闯关地图 -->
    <div class="adventure-map" v-if="currentView === 'map'">
      <div class="map-header">
        <div class="header-content">
          <h1 class="map-title">🗺️ 英语闯关之旅</h1>
          <p class="map-subtitle">完成每个关卡，提升你的英语水平</p>
        </div>

        <!-- 章节信息 -->
        <div class="chapter-info" v-if="userInfo && userInfo.currentChapter">
          <div class="current-chapter">
            <span class="chapter-label">当前章节:</span>
            <span class="chapter-name">{{ chapters[userInfo.currentChapter]?.name || '未知章节' }}</span>
          </div>
          <button class="chapter-switch-btn" @click="goToChapterSelection">
            切换章节
          </button>
        </div>
      </div>

      <div class="levels-container">
        <div class="level-path">
          <!-- 第一关：词汇练习 -->
          <div class="level-node" :class="getLevelClass('wordP')" @click="enterLevel('wordP')">
            <div class="level-icon">📚</div>
            <div class="level-info">
              <h3 class="level-title">第一关</h3>
              <p class="level-name">词汇练习</p>
              <div class="level-progress">{{ getLevelProgress('wordP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('wordP') }}</div>
          </div>

          <!-- 连接线 -->
          <div class="level-connector" :class="{ 'unlocked': isLevelUnlocked('spellP') }"></div>

          <!-- 第二关：词汇拼写 -->
          <div class="level-node" :class="getLevelClass('spellP')" @click="enterLevel('spellP')">
            <div class="level-icon">✏️</div>
            <div class="level-info">
              <h3 class="level-title">第二关</h3>
              <p class="level-name">词汇拼写</p>
              <div class="level-progress">{{ getLevelProgress('spellP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('spellP') }}</div>
          </div>

          <!-- 连接线 -->
          <div class="level-connector" :class="{ 'unlocked': isLevelUnlocked('listenP') }"></div>

          <!-- 第三关：听力训练 -->
          <div class="level-node" :class="getLevelClass('listenP')" @click="enterLevel('listenP')">
            <div class="level-icon">🎧</div>
            <div class="level-info">
              <h3 class="level-title">第三关</h3>
              <p class="level-name">听力训练</p>
              <div class="level-progress">{{ getLevelProgress('listenP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('listenP') }}</div>
          </div>

          <!-- 连接线 -->
          <div class="level-connector" :class="{ 'unlocked': isLevelUnlocked('customsP') }"></div>

          <!-- 第四关：AI生成题目 -->
          <div class="level-node" :class="getLevelClass('customsP')" @click="enterLevel('customsP')">
            <div class="level-icon">🤖</div>
            <div class="level-info">
              <h3 class="level-title">第四关</h3>
              <p class="level-name">AI生成题目</p>
              <div class="level-progress">{{ getLevelProgress('customsP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('customsP') }}</div>
          </div>

          <!-- 连接线 -->
          <div class="level-connector" :class="{ 'unlocked': isLevelUnlocked('coverP') }"></div>

          <!-- 第五关：AI对话 -->
          <div class="level-node" :class="getLevelClass('coverP')" @click="enterLevel('coverP')">
            <div class="level-icon">💬</div>
            <div class="level-info">
              <h3 class="level-title">第五关</h3>
              <p class="level-name">AI对话练习</p>
              <div class="level-progress">{{ getLevelProgress('coverP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('coverP') }}</div>
          </div>
        </div>
      </div>

      <!-- 总体进度 -->
      <div class="overall-progress">
        <h3>总体进度</h3>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <p>{{ completedLevels }}/5 关卡完成</p>
      </div>
    </div>

    <!-- 第一关：词汇练习 -->
    <div class="level-content" v-if="currentView === 'level-wordP'">
      <div class="level-header">
        <button class="back-btn" @click="backToMap">← 返回地图</button>
        <div class="level-info">
          <h2>📚 第一关：词汇练习</h2>
          <p>学习新单词，选择你对每个单词的熟悉程度</p>
        </div>
      </div>

      <!-- 使用词汇练习组件 -->
      <VocabularyPractice v-if="!showLevelComplete" :words="vocabularyWords" :currentIndex="currentWordIndex"
        @know="handleKnow" @vague="handleVague" @unknown="handleUnknown" @next="handleNext"
        @complete="handleVocabularyComplete" />
      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showLevelComplete">
        <div class="complete-icon">🎉</div>
        <h3>第一关完成！</h3>
        <p>你已经完成了词汇练习，学习了 {{ vocabularyWords.length }} 个单词</p>
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
          <button class="btn-primary" @click="nextLevel">进入下一关</button>
          <button class="btn-secondary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>

    <!-- 第二关：词汇拼写 -->
    <div class="level-content" v-if="currentView === 'level-spellP'">
      <div class="level-header">
        <button class="back-btn" @click="backToMap">← 返回地图</button>
        <div class="level-info">
          <h2>✏️ 第二关：词汇拼写</h2>
          <p>根据中文释义和发音，拼写出正确的单词</p>
        </div>
      </div>

      <!-- 使用拼写练习组件 -->
      <SpellingPractice v-if="!showSpellingComplete" :words="spellingWords" :startIndex="0"
        @complete="handleSpellingComplete" @next="handleSpellingNext" @correct="handleSpellingCorrect"
        @incorrect="handleSpellingIncorrect" />

      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showSpellingComplete">
        <div class="complete-icon">🎉</div>
        <h3>第二关完成！</h3>
        <p>你已经完成了拼写练习，练习了 {{ spellingWords.length }} 个单词</p>
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
          <button class="btn-primary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>

    <!-- 第三关：听力训练 -->
    <div class="level-content" v-if="currentView === 'level-listenP'">
      <div class="level-header">
        <button class="back-btn" @click="backToMap">← 返回地图</button>
        <div class="level-info">
          <h2>🎧 第三关：听力训练</h2>
          <p>听单词发音，根据听到的内容拼写出正确的单词</p>
        </div>
      </div>

      <!-- 使用听力练习组件 -->
      <ListeningPractice v-if="!showListeningComplete" :words="listeningWords" @complete="handleListeningComplete"
        @correct="handleListeningCorrect" @incorrect="handleListeningIncorrect" />

      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showListeningComplete">
        <div class="complete-icon">🎉</div>
        <h3>第三关完成！</h3>
        <p>你已经完成了听力训练，练习了 {{ listeningStats.total }} 个单词</p>
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
          <button class="btn-primary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>

    <!-- 第四关：AI生成题目 -->
    <div class="level-content" v-if="currentView === 'level-customsP'">
      <div class="level-header">
        <button class="back-btn" @click="backToMap">← 返回地图</button>
        <div class="level-info">
          <h2>🤖 第四关：AI生成题目</h2>
          <p>AI根据你的学习情况生成个性化题目，检验学习效果</p>
        </div>
      </div>

      <!-- 使用AI题目练习组件 -->
      <AIQuestionPractice v-if="!showAIQuestionComplete" :positionType="currentPositionType" :wordList="aiQuestionWords"
        :preloadedQuestions="preloadedAIQuestions" :usePreloaded="isAIQuestionsPreloaded"
        @complete="handleAIQuestionComplete" @correct="handleAIQuestionCorrect" @incorrect="handleAIQuestionIncorrect"
        @answer="handleAIQuestionAnswer" @questionsGenerated="handleQuestionsGenerated" />

      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showAIQuestionComplete">
        <div class="complete-icon">🎉</div>
        <h3>第四关完成！</h3>
        <p>你已经完成了AI生成题目练习，共完成 {{ aiQuestionStats.total }} 道题目</p>
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
          <button class="btn-primary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>

    <!-- 第五关：AI对话 -->
    <div class="level-content" v-if="currentView === 'level-coverP'">
      <!-- 使用AI对话练习组件 -->
      <AIChatPractice v-if="!showAIChatComplete" :chapter="currentChapter" @complete="handleAIChatComplete"
        @exit="handleAIChatExit" />

      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showAIChatComplete">
        <div class="complete-icon">🎉</div>
        <h3>第五关完成！</h3>
        <p>恭喜你完成了AI对话练习！你已经完成了所有闯关挑战！</p>
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
          <button class="btn-primary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>

    <!-- AI题目加载窗口 -->
    <AIQuestionLoadingModal :visible="showAILoadingModal" @continue="handleAILoadingContinue"
      @close="handleAILoadingContinue" ref="aiLoadingModal" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserInfo, changeInfo, switchChapter } from '@/api/auth'
import { useRoute, useRouter } from 'vue-router'
import { getReviewWords } from '@/api/word'

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

// 听力练习相关数据
const listeningWords = ref([])
const showListeningComplete = ref(false)
const listeningStats = ref({ total: 0, correct: 0, accuracy: 0 })

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

// 方法
const getLevelClass = (level) => {
  if (!userInfo.value) return 'locked'

  // 优先使用多章节数据
  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    if (chapterProgress && chapterProgress[level]) return 'completed'
  } else {
    // 兼容旧数据结构
    const cet4 = userInfo.value.cet4
    if (cet4 && cet4[level]) return 'completed'
  }

  if (isLevelUnlocked(level)) return 'unlocked'
  return 'locked'
}

const getLevelProgress = (level) => {
  if (!userInfo.value) return '未开始'

  // 优先使用多章节数据
  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    if (chapterProgress && chapterProgress[level]) return '✅ 已完成'
  } else {
    // 兼容旧数据结构
    const cet4 = userInfo.value.cet4
    if (cet4 && cet4[level]) return '✅ 已完成'
  }

  return '未开始'
}

const getLevelStatus = (level) => {
  if (!userInfo.value) return '🔒'

  // 优先使用多章节数据
  if (userInfo.value.chapters && userInfo.value.currentChapter) {
    const chapterProgress = userInfo.value.chapters[userInfo.value.currentChapter]
    if (chapterProgress && chapterProgress[level]) return '✅'
  } else {
    // 兼容旧数据结构
    const cet4 = userInfo.value.cet4
    if (cet4 && cet4[level]) return '✅'
  }

  if (isLevelUnlocked(level)) return '🔓'
  return '🔒'
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

  // 更新用户学习进度
  try {
    // 获取当前进度
    const progressResponse = await fetch('/api/word/getWordProgress')
    const progressData = await progressResponse.json()

    if (progressData.code === 200 && progressData.data) {
      // 解析当前位置
      const position = progressData.data
      const parts = position.split(':')
      if (parts.length === 2) {
        const letter = parts[0]
        let index = parseInt(parts[1]) || 0

        // 增加已学习的单词数量
        index += vocabularyWords.value.length

        // 更新进度
        const updateResponse = await fetch('/api/word/updateWordProgress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studyWords: vocabularyWords.value.length
          })
        })

        const updateData = await updateResponse.json()
        if (updateData.code === 200) {
          console.log('学习进度更新成功')
        } else {
          console.error('学习进度更新失败:', updateData.message)
        }
      }
    }
  } catch (error) {
    console.error('更新学习进度出错:', error)
  }

  // 显示第一关完成提示，然后预加载AI题目
  await showFirstLevelCompleteAndPreload()
}

// 第一关完成后的预加载流程
const showFirstLevelCompleteAndPreload = async () => {
  // 先显示第一关完成的提示
  const message = `🎉 第一关完成！\n\n您的单词掌握情况：\n✅ 认识：${knownWords.value}个\n🤔 模糊：${vagueWords.value}个\n❓ 不认识：${unknownWords.value}个\n\n您的单词情况我们基本了解，点击确定AI将为您生成后续专属题目！`

  if (confirm(message)) {
    // 用户点击确定，开始预加载AI题目
    await startAIQuestionPreload()
    // 完成第一关
    await completeLevel('wordP')
  } else {
    // 用户取消，直接完成第一关
    await completeLevel('wordP')
  }
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
      alert(`AI题目生成失败: ${data.message || '未知错误'}`)
    }

  } catch (error) {
    console.error('预加载AI题目失败:', error)
    showAILoadingModal.value = false
    alert('网络错误，请检查连接后重试')
  }
}

// 完成AI题目预加载
const completeAIQuestionPreload = () => {
  showAILoadingModal.value = false
  // 显示惊喜提示
  setTimeout(() => {
    alert('🎉 太棒了！AI已经为您生成了专属的场景练习题目，快去第四关体验吧！')
  }, 500)
}

// 处理加载窗口的继续按钮
const handleAILoadingContinue = () => {
  completeAIQuestionPreload()
}

const handleSpellingComplete = async () => {
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
    currentView.value = 'level-listenP'
  }
}

const handleListeningComplete = async (stats) => {
  listeningStats.value = stats
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
  // 进入下一关（暂时返回地图）
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-size: 0.9rem;
  opacity: 0.8;
}

.chapter-name {
  font-size: 1.1rem;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.chapter-switch-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.chapter-switch-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.map-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
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
  background: white;
  border-radius: 12px;
  padding: 1rem;
  min-width: 150px;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.level-node.completed {
  background: #4CAF50;
  color: white;
}

.level-node.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.level-title {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.level-name {
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.level-progress {
  font-size: 0.7rem;
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
  width: 40px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
}

.level-connector.unlocked {
  background: #4CAF50;
}

.overall-progress {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  color: white;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  height: 16px;
  margin: 0.5rem 0;
}

.progress-fill {
  background: #4CAF50;
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.level-content {
  max-width: 600px;
  margin: 0 auto;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  color: white;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
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
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.complete-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.complete-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
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
</style>
