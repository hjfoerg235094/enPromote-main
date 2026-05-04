<template>
  <div class="spelling-practice">
    <!-- 进度条 -->
    <div class="spelling-header">
      <div class="progress-info">
        <span class="progress-text">拼写练习</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <span class="progress-count">{{ currentIndex + 1 }} / {{ words.length }}</span>
      </div>
    </div>

    <!-- 当前单词 -->
    <div class="word-section" v-if="currentWord">
      <div class="word-hint">
        <h3 class="hint-text">请拼写这个单词：</h3>
        <p class="meaning">{{ currentWord.mean || currentWord.chineseMeaning }}</p>
        <div class="phonetic" v-if="currentWord.phonetic_symbol || currentWord.phonetic">
          {{ currentWord.phonetic_symbol || currentWord.phonetic }}
        </div>
      </div>

      <!-- 拼写输入区域 -->
      <div class="spelling-input-area">
        <div class="letters-container">
          <div v-for="(letter, index) in wordLetters" :key="index" class="letter-slot" :class="{
            'active': index === currentPosition,
            'filled': userInput[index] !== '',
            'correct': showResult && userInput[index] === letter,
            'incorrect': showResult && userInput[index] !== letter && userInput[index] !== ''
          }">
            <span class="user-letter">{{ userInput[index] || '' }}</span>
            <div class="underline"></div>
          </div>
        </div>
      </div>

      <!-- 结果显示 -->
      <div v-if="showResult" class="result-section">
        <div class="result-message" :class="{ 'success': isCorrect, 'error': !isCorrect }">
          <div class="result-icon">
            {{ isCorrect ? '✅' : '❌' }}
          </div>
          <div class="result-text">
            <h3>{{ isCorrect ? '拼写正确！' : '拼写错误' }}</h3>
            <p v-if="!isCorrect">
              正确答案：<strong>{{ currentWord.word }}</strong>
            </p>
          </div>
        </div>

        <div class="result-actions">
          <button class="next-btn" @click="nextWord">
            {{ currentIndex < words.length - 1 ? '下一个单词' : '完成练习' }} </button>
              <p class="result-hint">💡 按回车键快速继续</p>
        </div>
      </div>

      <!-- 操作提示 -->
      <div v-if="!showResult" class="input-hint">
        <p>请输入字母，按回车键确认</p>
        <button class="hint-btn" @click="showHint" v-if="!hintShown">
          💡 显示提示
        </button>
        <div v-if="hintShown" class="hint-display">
          <p>单词长度：{{ currentWord.word.length }} 个字母</p>
          <p>首字母：{{ currentWord.word[0].toUpperCase() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getWordAudio } from '@/api/word'

// Props
const props = defineProps({
  words: {
    type: Array,
    default: () => []
  },
  startIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['complete', 'next', 'correct', 'incorrect'])

// 响应式数据
const currentIndex = ref(props.startIndex)
const userInput = ref([])
const currentPosition = ref(0)
const showResult = ref(false)
const isCorrect = ref(false)
const hintShown = ref(false)
const audioEnd = ref(false)





// 计算属性
const progressPercentage = computed(() => {
  if (props.words.length === 0) return 0
  return Math.min(100, ((currentIndex.value + 1) / props.words.length) * 100)
})

const currentWord = computed(() => {
  return props.words[currentIndex.value]
})

const wordLetters = computed(() => {
  if (!currentWord.value?.word) return []
  return currentWord.value.word.toLowerCase().split('')
})

// 监听当前单词变化，重置状态
watch(currentWord, () => {
  resetWordState()
})

// showResult == true说明用户打完 播放音频
watch(showResult, async (next_showResult) => {
  // console.log(next_showResult.valueOf());
  if (next_showResult.valueOf() == true) {
    const result = await getWordAudio({ word: currentWord.value.word });
    const audioUrl = result.data.data;
    // console.log('audioUrl:' + audioUrl);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      audioEnd.value = true
    }

    audio.play().catch(err => {
      console.error('词汇练习音频播放失败', err);
    })
  }
})

// 方法
const resetWordState = () => {
  userInput.value = new Array(wordLetters.value.length).fill('')
  currentPosition.value = 0
  showResult.value = false
  isCorrect.value = false
  hintShown.value = false
}

const showHint = () => {
  hintShown.value = true
}

const handleKeyPress = (event) => {
  const key = event.key.toLowerCase()

  // 如果显示结果并且音频播放完成，Enter键进入下一个单词
  if (showResult.value && audioEnd.value) {

    if (key === 'enter') {
      nextWord()
    }
    return
  }
  // 在还没有展示结果时检查 
  if (key === 'enter' && !showResult.value) {

    checkSpelling()
  } else if (key === 'backspace') {
    // 修复删除逻辑：允许删除当前位置的字母
    if (currentPosition.value > 0 && userInput.value[currentPosition.value] === '') {
      // 如果当前位置为空，删除前一个位置的字母
      currentPosition.value--
      userInput.value[currentPosition.value] = ''
    } else if (userInput.value[currentPosition.value] !== '') {
      // 如果当前位置有字母，删除当前位置的字母
      userInput.value[currentPosition.value] = ''
    } else if (currentPosition.value > 0) {
      // 如果当前位置为空且不是第一个位置，移动到前一个位置
      currentPosition.value--
      userInput.value[currentPosition.value] = ''
    }
    // TODO 原本只key只能输入a-z 但不知为和可输入其他特殊键位只能禁用一些常用的
  } else if (key.match(/[a-z]/) && key !== 'enter' && key !== 'capslock' && currentPosition.value < wordLetters.value.length) {

    userInput.value[currentPosition.value] = key
    if (currentPosition.value < wordLetters.value.length - 1) {
      currentPosition.value++
    }
  }
}

const checkSpelling = () => {
  const userWord = userInput.value.join('').toLowerCase()
  const correctWord = currentWord.value.word.toLowerCase()

  isCorrect.value = userWord === correctWord
  showResult.value = true

  if (isCorrect.value) {
    emit('correct', currentIndex.value)
  } else {
    emit('incorrect', currentIndex.value)
  }
}

const nextWord = () => {
  audioEnd.value = false
  if (currentIndex.value < props.words.length - 1) {
    currentIndex.value++
    emit('next', currentIndex.value)
  } else {
    emit('complete')
  }
}

// 生命周期
onMounted(() => {
  resetWordState()
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.spelling-practice {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.spelling-header {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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

.word-section {
  text-align: center;
}

.word-hint {
  margin-bottom: 2rem;
}

.hint-text {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
}

.meaning {
  font-size: 1.5rem;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.phonetic {
  font-size: 1rem;
  color: #666;
  font-family: 'Courier New', monospace;
}

.spelling-input-area {
  margin-bottom: 2rem;
}

.letters-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.letter-slot {
  position: relative;
  width: 40px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-letter {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  text-transform: lowercase;
}

.underline {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ddd;
  border-radius: 1px;
}

.letter-slot.active .underline {
  background: #667eea;
  animation: blink 1s infinite;
}

.letter-slot.filled .underline {
  background: #333;
}

.letter-slot.correct .user-letter {
  color: #4CAF50;
}

.letter-slot.correct .underline {
  background: #4CAF50;
}

.letter-slot.incorrect .user-letter {
  color: #f44336;
}

.letter-slot.incorrect .underline {
  background: #f44336;
}

@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

.result-section {
  margin-top: 2rem;
}

.result-message {
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.result-message.success {
  background: #e8f5e8;
  border: 2px solid #4CAF50;
}

.result-message.error {
  background: #ffeaea;
  border: 2px solid #f44336;
}

.result-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.result-text h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.result-text p {
  margin: 0;
  color: #666;
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.result-hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #888;
  font-style: italic;
}

.input-hint {
  margin-top: 2rem;
  color: #666;
}

.hint-btn {
  background: #FF9800;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 1rem;
}

.hint-display {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  border-left: 4px solid #FF9800;
}

@media (max-width: 768px) {
  .spelling-practice {
    padding: 1rem;
  }

  .letters-container {
    gap: 4px;
  }

  .letter-slot {
    width: 30px;
    height: 40px;
  }

  .user-letter {
    font-size: 1.2rem;
  }
}
</style>
