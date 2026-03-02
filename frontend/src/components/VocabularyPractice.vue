<template>
  <div class="vocabulary-practice">
    <!-- 进度条 -->
    <div class="practice-header">
      <div class="progress-info">
        <span class="progress-text">词汇练习</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <span class="progress-count">{{ currentWordIndex + 1 }} / {{ words.length }}</span>
      </div>
    </div>

    <!-- 单词显示区域 -->
    <div class="word-display-area">
      <div class="word-card">
        <div class="word-main">
          <h2 class="word-text">{{ currentWord }}</h2>
          <div class="phonetic" v-if="currentPhonetic">[{{ currentPhonetic }}]</div>
        </div>

        <div class="word-actions">
          <button class="hint-btn" @click="toggleMeaning" :class="{ active: showMeaning }">
            💡 {{ showMeaning ? '隐藏释义' : '显示释义' }}
          </button>
        </div>

        <div class="meaning-section" v-if="showMeaning">
          <div class="meaning-content">
            <p class="meaning-text">{{ currentMeaning }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <div class="action-buttons">
        <button class="action-btn know-btn" :class="{ disabled: !showMeaning }" :disabled="!showMeaning"
          @click="handleKnow">
          <span class="btn-icon">✅</span>
          <span class="btn-text">认识</span>
        </button>
        <button class="action-btn vague-btn" @click="handleVague">
          <span class="btn-icon">🤔</span>
          <span class="btn-text">模糊</span>
        </button>
        <button class="action-btn unknown-btn" @click="handleUnknown">
          <span class="btn-icon">❌</span>
          <span class="btn-text">不认识</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { updateWordPriority, getWordAudio } from '@/api/word'
// Props
const props = defineProps({
  words: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['know', 'vague', 'unknown', 'next'])

// 响应式数据
const currentWordIndex = ref(props.currentIndex)
const showMeaning = ref(false)

const progressPercentage = computed(() => {
  if (props.words.length === 0) return 0
  return (currentWordIndex.value / props.words.length) * 100
})

const currentWord = computed(() => {
  const word = props.words[currentWordIndex.value]
  return word?.word || ''
})

const currentPhonetic = computed(() => {
  const word = props.words[currentWordIndex.value]
  return word?.phonetic_symbol || word?.phonetic || ''
})

const currentMeaning = computed(() => {
  const word = props.words[currentWordIndex.value]
  return word?.mean || word?.chineseMeaning || ''
})

// 监听props变化
watch(() => props.currentIndex, (newIndex) => {
  currentWordIndex.value = newIndex
  showMeaning.value = false
})
// 监听currentWord以播放音频
watch(currentWord, async (newWord) => {
  if (newWord) {
    const result = await getWordAudio({ word: newWord });
    const audioUrl = result.data.data;
    console.log('audioUrl:' + audioUrl);

    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('词汇练习音频播放失败', err);
    })
  }
})

// 方法
const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value
}

const handleKnow = () => {
  if (!showMeaning.value) return

  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;

  updateWordPriority({
    word: wordToQuery,
    newStatus: "know"
  })
  emit('know', currentWordIndex.value)
  nextWord()
}

const handleVague = () => {
  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;

  updateWordPriority({
    word: wordToQuery,
    newStatus: "vague"
  })
  emit('vague', currentWordIndex.value)
  nextWord()
}

const handleUnknown = () => {
  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;

  updateWordPriority({
    word: wordToQuery,
    newStatus: "unknown"
  })
  emit('unknown', currentWordIndex.value)
  nextWord()
}

const nextWord = () => {
  showMeaning.value = false
  if (currentWordIndex.value < props.words.length - 1) {
    currentWordIndex.value++
    emit('next', currentWordIndex.value)
  } else {
    // 完成所有单词，更新学习进度
    emit('complete', {
      wordsCount: props.words.length,
      lastIndex: currentWordIndex.value
    })
  }
}
</script>

<style scoped>
.vocabulary-practice {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.practice-header {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 1rem;
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

.word-display-area {
  margin-bottom: 2rem;
}

.word-card {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
}

.word-main {
  margin-bottom: 1.5rem;
}

.word-text {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
}

.phonetic {
  font-size: 1.1rem;
  color: #666;
  font-family: 'Courier New', monospace;
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
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 2px solid #e9ecef;
}

.meaning-text {
  font-size: 1.1rem;
  color: #333;
  line-height: 1.6;
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

.know-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.vague-btn {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

.unknown-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
}

.action-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .vocabulary-practice {
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
}
</style>
