<template>
  <div class="flashcard-review">
    <div class="progress-bar">
      <div class="progress-text">{{ currentIndex + 1 }} / {{ totalWords }}</div>
      <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
    </div>
    
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">今日学习</span>
        <span class="stat-value">{{ todayStats.learned }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">掌握率</span>
        <span class="stat-value">{{ masteryRate }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">连击</span>
        <span class="stat-value streak">{{ streakCount }}</span>
      </div>
    </div>
    
    <div class="flashcard-area" v-if="currentWord">
      <div 
        class="flashcard" 
        :class="{ flipped: isFlipped }"
        @click="toggleCard"
      >
        <div class="flashcard-inner" :class="{ 'is-flipped': isFlipped }">
          <div class="flashcard-front">
            <div class="word-content">
              <h2 class="word">{{ currentWord.word }}</h2>
              <div class="phonetic" v-if="currentWord.phonetic_symbol">
                {{ currentWord.phonetic_symbol }}
              </div>
            </div>
            <div class="hint">点击翻转</div>
          </div>
          <div class="flashcard-back">
            <div class="meaning-content">
              <h3>{{ currentWord.meaning }}</h3>
              <div class="example" v-if="currentWord.example">
                <strong>例句:</strong> {{ currentWord.example }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="controls" v-if="currentWord && !isFlipped">
      <button class="btn btn-primary" @click="markAsKnown">
        <span>认识</span>
      </button>
      <button class="btn btn-secondary" @click="markAsUnknown">
        <span>不认识</span>
      </button>
    </div>
    
    <div class="review-controls" v-if="currentWord && isFlipped">
      <div class="difficulty-buttons">
        <button 
          v-for="difficulty in difficultyLevels" 
          :key="difficulty.value"
          class="btn-difficulty"
          :class="`btn-${difficulty.class}`"
          @click="submitReview(difficulty.value)"
        >
          {{ difficulty.label }}
        </button>
      </div>
    </div>
    
    <div class="navigation" v-if="currentWord">
      <button class="nav-btn prev" @click="prevCard" :disabled="currentIndex === 0">
        <i>‹</i>
      </button>
      <button class="nav-btn next" @click="nextCard" :disabled="currentIndex === words.length - 1">
        <i>›</i>
      </button>
    </div>
    
    <div class="review-summary" v-if="showSummary">
      <div class="summary-content">
        <h2>今日复习总结</h2>
        <div class="summary-stats">
          <div class="stat-circle">
            <span class="stat-number">{{ stats.reviewed }}</span>
            <span class="stat-label">已复习</span>
          </div>
          <div class="stat-circle">
            <span class="stat-number">{{ stats.correct }}</span>
            <span class="stat-label">答对</span>
          </div>
          <div class="stat-circle">
            <span class="stat-number">{{ accuracy }}%</span>
            <span class="stat-label">准确率</span>
          </div>
        </div>
        <div class="summary-actions">
          <button class="btn-primary" @click="continueReview">继续复习</button>
          <button class="btn-secondary" @click="goHome">回到首页</button>
        </div>
      </div>
    </div>
    
    <div v-if="!currentWord && !showSummary" class="empty-state">
      <div class="empty-icon">📚</div>
      <h3>暂无单词</h3>
      <p>当前没有需要复习的单词</p>
      <button class="btn btn-primary" @click="loadReviewWords">刷新</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReviewWords, submitWordReview } from '@/api/word'

const router = useRouter()

// 状态变量
const words = ref([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const showSummary = ref(false)
const todayStats = ref({ learned: 0, mastered: 0 })
const streakCount = ref(0)
const stats = ref({ reviewed: 0, correct: 0, incorrect: 0 })

// 难度等级
const difficultyLevels = [
  { value: 0, label: '很难', class: 'hard' },
  { value: 1, label: '较难', class: 'medium-hard' },
  { value: 2, label: '一般', class: 'medium' },
  { value: 3, label: '较易', class: 'easy-medium' },
  { value: 4, label: '很易', class: 'easy' }
]

// 计算属性
const currentWord = computed(() => {
  return words.value[currentIndex.value]
})

const totalWords = computed(() => {
  return words.value.length
})

const progressPercentage = computed(() => {
  if (totalWords.value === 0) return 0
  return ((currentIndex.value + 1) / totalWords.value) * 100
})

const masteryRate = computed(() => {
  if (totalWords.value === 0) return 0
  const knownWords = words.value.filter(word => word.status === 'know').length
  return Math.round((knownWords / totalWords.value) * 100)
})

const accuracy = computed(() => {
  if (stats.value.reviewed === 0) return 0
  return Math.round((stats.value.correct / stats.value.reviewed) * 100)
})

// 方法
const toggleCard = () => {
  isFlipped.value = !isFlipped.value
}

const markAsKnown = () => {
  submitReview(3) // 标记为较易
}

const markAsUnknown = () => {
  submitReview(0) // 标记为很难
}

const submitReview = async (difficulty) => {
  const word = currentWord.value
  if (!word) return
  
  try {
    const isCorrect = difficulty > 2
    const newStatus = isCorrect ? 'know' : 'unknown'
    
    // 调用API提交复习结果
    const response = await submitWordReview({
      wordId: word.wordId || word._id,
      word: word.word,
      isCorrect,
      newStatus
    })
    
    if (response.data.code === 200) {
      // 更新单词状态
      word.status = newStatus
      
      // 更新统计数据
      stats.value.reviewed++
      if (isCorrect) {
        stats.value.correct++
        streakCount.value++
      } else {
        stats.value.incorrect++
        streakCount.value = 0
      }
      
      // 翻转到下一张卡片
      nextCard()
    } else {
      console.error('提交复习结果失败:', response.data.message)
    }
  } catch (error) {
    console.error('提交复习结果失败:', error)
  }
}

const nextCard = () => {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
    isFlipped.value = false
  } else {
    // 复习完成，显示总结
    showSummary.value = true
  }
}

const prevCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    isFlipped.value = false
  }
}

const loadReviewWords = async () => {
  try {
    const response = await getReviewWords()
    if (response.data.code === 200) {
      words.value = response.data.data.words
      currentIndex.value = 0
      isFlipped.value = false
      showSummary.value = false
    } else {
      console.error('获取复习单词失败:', response.data.message)
      words.value = []
    }
  } catch (error) {
    console.error('获取复习单词失败:', error)
    words.value = []
  }
}

const continueReview = () => {
  showSummary.value = false
  loadReviewWords()
}

const goHome = () => {
  router.push('/')
}

// 初始化
onMounted(() => {
  loadReviewWords()
})
</script>

<style scoped>
.flashcard-review {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

.progress-bar {
  position: relative;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: -25px;
  right: 0;
  font-size: 14px;
  color: #666;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-value.streak {
  color: #ff6b6b;
}

.flashcard-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

.flashcard {
  width: 100%;
  max-width: 500px;
  height: 300px;
  cursor: pointer;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flashcard-inner.is-flipped {
  transform: rotateY(180deg);
}

.flashcard-front, .flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.flashcard-front {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.flashcard-back {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  color: #333;
  transform: rotateY(180deg);
}

.word-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.word {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.phonetic {
  font-size: 1.2rem;
  opacity: 0.9;
}

.hint {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-top: 20px;
}

.meaning-content {
  width: 100%;
}

.meaning-content h3 {
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: #333;
}

.example {
  font-size: 1rem;
  line-height: 1.5;
  text-align: left;
  background: rgba(255,255,255,0.2);
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.review-controls {
  margin-top: 30px;
}

.difficulty-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
  color: white;
}

.btn-difficulty {
  padding: 10px 16px;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 70px;
}

.btn-hard {
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
  color: white;
}

.btn-medium-hard {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  color: #333;
}

.btn-medium {
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
  color: #333;
}

.btn-easy-medium {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #333;
}

.btn-easy {
  background: linear-gradient(135deg, #00b09b 0%, #96c93d 100%);
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.btn:active {
  transform: translateY(0);
}

.navigation {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.nav-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #f0f0f0;
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-summary {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.summary-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.summary-content h2 {
  margin-top: 0;
  color: #333;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
}

.stat-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4facfe;
}

.stat-label {
  font-size: 0.9rem;
  color: #888;
}

.summary-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

/* Flip animation */
.flip-enter-active, .flip-leave-active {
  transition: all 0.6s ease;
}

.flip-enter-from {
  opacity: 0;
  transform: rotateY(90deg);
}

.flip-leave-to {
  opacity: 0;
  transform: rotateY(-90deg);
}

/* Responsive design */
@media (max-width: 768px) {
  .flashcard {
    height: 250px;
  }
  
  .word {
    font-size: 2.2rem;
  }
  
  .controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .difficulty-buttons {
    flex-direction: column;
  }
  
  .btn-difficulty {
    width: 100%;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 10px;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .summary-actions {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
  }
}
</style>