<template>
  <div class="word-review-container">
    <!-- 进度条 -->
    <div class="review-header">
      <div class="progress-info">
        <span class="progress-text">单词复习</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <span class="progress-count">{{ currentWordIndex + 1 }} / {{ reviewWords.length }}</span>
      </div>
      <div class="review-stats">
        <div class="stat-item">
          <span class="stat-label">今日复习</span>
          <span class="stat-value">{{ todayReviewCount }}</span>
        </div>
      </div>
    </div>

    <!-- 单词卡片 -->
    <div class="word-card-container">
      <div class="word-card" v-if="currentWord">
        <div class="word-main">
          <h2 class="word-text" @click="toggleMeaning" :class="{ clickable: true }">{{ currentWord.word }}</h2>
          <div class="phonetic" v-if="currentWord.phonetic_symbol">
            [{{ currentWord.phonetic_symbol }}]
          </div>
          <button class="audio-btn" @click="playAudio">
            🔊
          </button>
        </div>

        <div class="word-actions">
          <button class="hint-btn" @click="toggleMeaning" :class="{ active: showMeaning }">
            💡 {{ showMeaning ? '隐藏释义' : '显示释义' }}
          </button>
        </div>

        <div class="meaning-section" v-if="showMeaning">
          <div class="meaning-content">
              <p class="meaning-text">
                {{ currentWord?.meaning || '⚠️ 暂无该单词的释义数据' }}
              </p>
          </div>
        </div>

        <div class="meaning-section" v-if="showMeaning">
          <div class="meaning-content">
            <div class="example-section">
              <div class="example-header">
                <h4 class="example-title">例句</h4>
                <button class="generate-example-btn" @click="generateExample" :disabled="isGeneratingExample">
                  {{ isGeneratingExample ? '生成中...' : '生成例句' }}
                </button>
              </div>
              <div class="example-list" v-if="currentWord && currentWord.example">
                <div class="example-item">
                  <p class="example-text">{{ currentWord.example }}</p>
                </div>
              </div>
              <p class="no-example" v-else>暂无例句，点击"生成例句"按钮生成</p>
            </div>
          </div>
        </div>

        <!-- 发音练习组件 -->
        <OralPractice
          ref="oralPracticeRef"
          v-if="currentWord && currentWord.word"
          :text="currentWord.word"
          category="word"
        />

      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <div class="action-buttons">
        <button class="action-btn unknown-btn" @click="handleUnknown">
          <span class="btn-icon">❌</span>
          <span class="btn-text">不认识</span>
        </button>
        <button class="action-btn vague-btn" @click="handleVague">
          <span class="btn-icon">🤔</span>
          <span class="btn-text">模糊</span>
        </button>
        <button class="action-btn know-btn" @click="handleKnow">
          <span class="btn-icon">✅</span>
          <span class="btn-text">认识</span>
        </button>
        <button class="action-btn mastered-btn" @click="handleMastered">
          <span class="btn-icon">🏆</span>
          <span class="btn-text">已掌握</span>
        </button>
      </div>
    </div>

    <!-- 完成复习弹窗 -->
    <div class="completion-modal" v-if="showCompletionModal">
      <div class="modal-content">
        <h2 class="modal-title">复习完成！</h2>
        <div class="completion-stats">
          <div class="stat-row">
            <span class="stat-label">复习单词数：</span>
            <span class="stat-value">{{ reviewedWordsCount }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">掌握状态：</span>
            <div class="status-breakdown">
              <div class="status-item">
                <span class="status-indicator unknown"></span>
                <span>不认识: {{ statusCounts.unknown }}</span>
              </div>
              <div class="status-item">
                <span class="status-indicator vague"></span>
                <span>模糊: {{ statusCounts.vague }}</span>
              </div>
              <div class="status-item">
                <span class="status-indicator know"></span>
                <span>认识: {{ statusCounts.know }}</span>
              </div>
              <div class="status-item">
                <span class="status-indicator mastered"></span>
                <span>已掌握: {{ statusCounts.mastered }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="continue-btn" @click="continueReview">继续复习</button>
          <button class="finish-btn" @click="finishReview">完成复习</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getReviewWords, updateWordPriority, getWordAudio } from '@/api/word'
import { getReviewStats } from '@/api/reviewPlan'
import { generateWordExample } from '@/api/wordExample'
import OralPractice from '@/components/OralPractice.vue'

const router = useRouter()

// 响应式数据
const reviewWords = ref([])
const currentWordIndex = ref(0)
const showMeaning = ref(false)
const showCompletionModal = ref(false)
const todayReviewCount = ref(0)
const reviewedWordsCount = ref(0)
const statusCounts = ref({
  unknown: 0,
  vague: 0,
  know: 0,
  mastered: 0
})
const isGeneratingExample = ref(false) // 添加生成例句的加载状态
const oralPracticeRef = ref(null) // 口语练习组件的引用

// 计算属性
const progressPercentage = computed(() => {
  if (reviewWords.value.length === 0) return 0
  return (currentWordIndex.value / reviewWords.value.length) * 100
})

const currentWord = computed(() => {
  return reviewWords.value[currentWordIndex.value]
})

// 监听currentWord变化，自动播放音频
watch(currentWord, async (newWord) => {
  if (newWord && newWord.word) {
    showMeaning.value = false

    // 重置口语评测状态
    if (oralPracticeRef.value && oralPracticeRef.value.resetEvaluation) {
      oralPracticeRef.value.resetEvaluation();
    }

    // 自动播放单词音频
    try {
      const result = await getWordAudio({ word: newWord.word });
      const audioUrl = result.data.data;
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('音频播放失败', err);
      });
    } catch (error) {
      console.error('获取音频失败', error);
    }
  }
})

// 页面加载时获取复习单词
onMounted(async () => {
  await loadReviewWords()
  await loadReviewStats()
})

// 加载复习单词
const loadReviewWords = async () => {
  try {
    const response = await getReviewWords()
    console.log('[loadReviewWords] 后端返回的完整响应:', response)
    console.log('[loadReviewWords] 后端返回的数据:', response.data)
    if (response.data && response.data.code === 200) {
      reviewWords.value = response.data.data.words
      console.log('[loadReviewWords] 单词列表:', reviewWords.value)
      console.log('[loadReviewWords] 第一个单词:', reviewWords.value[0])
      if (reviewWords.value.length === 0) {
        // 没有需要复习的单词
        showCompletionModal.value = true
      }
    }
  } catch (error) {
    console.error('获取复习单词失败:', error)
  }
}

// 加载复习统计
const loadReviewStats = async () => {
  try {
    const response = await getReviewStats()
    if (response.data && response.data.code === 200) {
      todayReviewCount.value = response.data.data.todayReviewCount
    }
  } catch (error) {
    console.error('获取复习统计失败:', error)
  }
}

// 播放音频
const playAudio = async () => {
  if (!currentWord.value || !currentWord.value.word) return

  try {
    const result = await getWordAudio({ word: currentWord.value.word });
    const audioUrl = result.data.data;
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('音频播放失败', err);
    });
  } catch (error) {
    console.error('获取音频失败', error);
  }
}

// 切换释义显示
const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value
}

// 生成单词例句
const generateExample = async () => {
  if (!currentWord.value || !currentWord.value.wordId) return

  isGeneratingExample.value = true
  try {
    const response = await generateWordExample(currentWord.value.wordId)
    if (response.data && response.data.code === 200) {
      // 更新当前单词的例句
      if (currentWord.value) {
        currentWord.value.example = response.data.data.example
      }
    }
  } catch (error) {
    console.error('生成例句失败:', error)
  } finally {
    isGeneratingExample.value = false
  }
}

// 处理单词状态更新
const updateWordStatus = async (status) => {
  if (!currentWord.value) return

  try {
    // 将状态映射为正确性（isCorrect）
    const isCorrect = status === 'know' || status === 'mastered';
    
    await updateWordPriority({
      wordId: currentWord.value.wordId,
      isCorrect: isCorrect
    })

    // 更新统计
    reviewedWordsCount.value++
    statusCounts.value[status]++

    // 进入下一个单词
    nextWord()
  } catch (error) {
    console.error('更新单词状态失败:', error)
  }
}

// 各种状态处理函数
const handleUnknown = () => updateWordStatus('unknown')
const handleVague = () => updateWordStatus('vague')
const handleKnow = () => updateWordStatus('know')
const handleMastered = () => updateWordStatus('mastered')

// 下一个单词
const nextWord = () => {
  if (currentWordIndex.value < reviewWords.value.length - 1) {
    currentWordIndex.value++
  } else {
    // 完成所有单词复习
    showCompletionModal.value = true
  }
}

// 继续复习
const continueReview = async () => {
  showCompletionModal.value = false
  // 重置状态
  currentWordIndex.value = 0
  reviewedWordsCount.value = 0
  statusCounts.value = {
    unknown: 0,
    vague: 0,
    know: 0,
    mastered: 0
  }
  // 重新加载复习单词
  await loadReviewWords()
  await loadReviewStats()
}

// 完成复习
const finishReview = () => {
  // 返回复习计划页面
  router.push('/reviewPlan')
}
</script>

<style scoped>
.word-review-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.progress-text {
  font-weight: 600;
  color: #333;
  min-width: 80px;
}

.progress-bar {
  flex: 1;
  background: #f0f0f0;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-count {
  font-size: 14px;
  color: #666;
  min-width: 60px;
  text-align: right;
}

.review-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px 16px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.word-card-container {
  margin-bottom: 24px;
}

.word-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.word-main {
  margin-bottom: 1.5rem;
  position: relative;
}

.word-text {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.word-text.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.word-text.clickable:hover {
  color: #667eea;
}

.phonetic {
  font-size: 1.1rem;
  color: #666;
  font-family: 'Courier New', monospace;
}

.audio-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.audio-btn:hover {
  opacity: 1;
}

.word-actions {
  margin-bottom: 1.5rem;
}

.hint-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.hint-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.hint-btn.active {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.meaning-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-top: 1rem;
  border: 2px solid #e9ecef;
}

.meaning-text {
  font-size: 1.1rem;
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.example-section {
  margin-top: 1rem;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.example-title {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
  margin: 0;
}

.generate-example-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.generate-example-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.generate-example-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.example-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.example-text {
  font-size: 1rem;
  color: #333;
  line-height: 1.6;
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

.example-translation {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.no-example {
  font-size: 0.95rem;
  color: #999;
  text-align: center;
  padding: 1rem;
  margin: 0;
}

.action-section {
  text-align: center;
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
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
}

.unknown-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.vague-btn {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

.know-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.mastered-btn {
  background: linear-gradient(135deg, #2196F3 0%, #0d8aee 100%);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1.5rem;
}

/* 完成弹窗样式 */
.completion-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

.completion-stats {
  margin-bottom: 1.5rem;
}

.stat-row {
  display: flex;
  margin-bottom: 1rem;
}

.stat-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.status-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.unknown {
  background-color: #f44336;
}

.status-indicator.vague {
  background-color: #FF9800;
}

.status-indicator.know {
  background-color: #4CAF50;
}

.status-indicator.mastered {
  background-color: #2196F3;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.continue-btn, .finish-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.continue-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.finish-btn {
  background: #f0f0f0;
  color: #333;
}

.continue-btn:hover, .finish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .word-review-container {
    padding: 1rem;
  }
  
  .word-text {
    font-size: 2rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-btn {
    min-width: auto;
    padding: 0.8rem 1rem;
  }
  
  .status-breakdown {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.status-indicator.unknown {
  background-color: #f44336;
}

.status-indicator.vague {
  background-color: #FF9800;
}

.status-indicator.know {
  background-color: #4CAF50;
}

.status-indicator.mastered {
  background-color: #2196F3;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.continue-btn, .finish-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.continue-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.finish-btn {
  background: #f0f0f0;
  color: #333;
}

.continue-btn:hover, .finish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .word-review-container {
    padding: 1rem;
  }

  .review-header {
    flex-direction: column;
    gap: 1rem;
  }

  .word-text {
    font-size: 2rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-btn {
    min-width: auto;
    padding: 0.8rem 1rem;
    flex-direction: row;
    justify-content: center;
  }
}
</style>
