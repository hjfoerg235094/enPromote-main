<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <!-- 拼写模式 -->
      <div v-if="mode === 'spelling'" class="spelling-mode">
        <div class="modal-header">
          <div class="celebration-icon">✏️</div>
          <h2 class="modal-title">单词拼写练习</h2>
        </div>

        <div class="modal-body">
          <div class="spelling-progress">
            <p class="progress-text">
              进度：{{ currentSpellingIndex + 1 }} / {{ totalSpellingWords }}
            </p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>

          <!-- 拼写组件 -->
          <Spelling :currentWord="currentSpellingWord" :currentIndex="currentSpellingIndex"
            :totalWords="totalSpellingWords" @complete="handleSpellingComplete" @next="nextSpellingWord"
            @exit="handleSpellingExit" />
        </div>
      </div>

      <!-- 学习完成模式 -->
      <div v-else-if="mode === 'completed'" class="completed-mode">
        <div class="modal-header">
          <div class="celebration-icon">🎉</div>
          <h2 class="modal-title">学习进度</h2>
        </div>

        <div class="modal-body">
          <div class="progress-info">
            <div class="words-count">
              <span class="count-number">{{ wordsCount }}</span>
              <span class="count-label">个单词</span>
            </div>
            <p class="congratulations">恭喜你完成了今天的学习目标！</p>
            <div class="progress-stats">
              <div class="stat-item">
                <div class="stat-icon">📚</div>
                <div class="stat-text">
                  <span class="stat-number">{{ wordsCount }}</span>
                  <span class="stat-label">已学单词</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">⏰</div>
                <div class="stat-text">
                  <span class="stat-number">{{ studyTime }}</span>
                  <span class="stat-label">学习时长</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleRest">
            <span class="btn-icon">☕</span>
            休息一下
          </button>
          <button class="btn btn-primary" @click="handleStartSpelling">
            <span class="btn-icon">✏️</span>
            开始拼写
          </button>
        </div>
      </div>

      <!-- 拼写完成模式 -->
      <div v-else-if="mode === 'spellingCompleted'" class="spelling-completed-mode">
        <div class="modal-header">
          <div class="celebration-icon">🏆</div>
          <h2 class="modal-title">拼写完成！</h2>
        </div>

        <div class="modal-body">
          <div class="progress-info">
            <div class="words-count">
              <span class="count-number">{{ wordsCount }}</span>
              <span class="count-label">个单词</span>
            </div>
            <p class="congratulations">太棒了！你已经完成了所有单词的拼写练习！</p>
            <div class="spelling-stats">
              <div class="stat-item">
                <div class="stat-icon">✅</div>
                <div class="stat-text">
                  <span class="stat-number">{{ correctSpellings }}</span>
                  <span class="stat-label">正确拼写</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🔄</div>
                <div class="stat-text">
                  <span class="stat-number">{{ retryCount }}</span>
                  <span class="stat-label">重试次数</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleRest">
            <span class="btn-icon">☕</span>
            休息一下
          </button>
          <button class="btn btn-primary" @click="handleContinue">
            <span class="btn-icon">🚀</span>
            继续下一组
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue';
import Spelling from './spelling.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  wordsCount: {
    type: Number,
    default: 10
  },
  startTime: {
    type: Date,
    default: null
  },
  mode: {
    type: String,
    default: 'completed' // 'completed', 'spelling', 'spellingCompleted'
  },
  wordsList: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'rest', 'continue', 'startSpelling']);

// 拼写相关状态
const spellingWords = ref([]);
watchEffect(() => {
  spellingWords.value = props.wordsList;
});
const currentSpellingIndex = ref(0);
const spellingResults = ref([]);
const incorrectWords = ref([]);
const retryCount = ref(0);

// 计算属性
const studyTime = computed(() => {
  if (!props.startTime) return '0分钟';
  const now = new Date();
  const diffMs = now - props.startTime;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return '1分钟';
  if (diffMins < 60) return `${diffMins}分钟`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}小时${mins}分钟`;
});

const currentSpellingWord = computed(() => {
  console.log(`spellingWords.value=${spellingWords.value}`);

  if (!spellingWords.value || spellingWords.value.length === 0) {
    return { word: 'hello', mean: '你好' };
  }

  if (currentSpellingIndex.value >= spellingWords.value.length) {
    const firstWord = spellingWords.value[0];
    return firstWord || { word: 'hello', mean: '你好' };
  }

  const wordItem = spellingWords.value[currentSpellingIndex.value];
  return wordItem;
});

const totalSpellingWords = computed(() => {
  return spellingWords.value.length;
});

const progressPercentage = computed(() => {
  if (totalSpellingWords.value === 0) return 0;
  return Math.round((currentSpellingIndex.value / totalSpellingWords.value) * 100);
});

const correctSpellings = computed(() => {
  return spellingResults.value.filter(result => result.isCorrect).length;
});

// 处理点击遮罩层
const handleOverlayClick = () => {
  // 可以选择是否允许点击遮罩关闭
  // emit('close');
};

// 处理休息按钮
const handleRest = () => {
  emit('close');
  emit('rest');

};

// 处理继续学习按钮
const handleContinue = () => {
  emit('continue');
  emit('close');
};

// 处理开始拼写按钮
const handleStartSpelling = () => {
  initializeSpelling();
  emit('startSpelling');
};

// 初始化拼写练习
const initializeSpelling = () => {
  // 保留完整的单词对象，包含word和mean属性
  const wordList = props.wordsList.map(item => {
    if (typeof item === 'string') {
      return { word: item, mean: '请拼写单词' };
    }
    return item; // 保留完整对象
  });

  // 打乱单词顺序
  spellingWords.value = shuffleArray([...wordList]);
  currentSpellingIndex.value = 0;
  spellingResults.value = [];
  incorrectWords.value = [];
  retryCount.value = 0;
};

// 打乱数组的工具函数
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 处理拼写完成
const handleSpellingComplete = (result) => {
  console.log('拼写完成:', result);

  // 记录拼写结果
  spellingResults.value.push({
    word: result.word,
    userInput: result.userInput,
    isCorrect: result.isCorrect,
    timestamp: new Date()
  });

  // 如果拼错了，加入错误单词列表（保存完整的单词对象）
  if (!result.isCorrect) {
    const currentWordObj = spellingWords.value[currentSpellingIndex.value];
    incorrectWords.value.push(currentWordObj);
  }
};

// 下一个拼写单词
const nextSpellingWord = () => {
  currentSpellingIndex.value++;

  // 检查是否完成了所有单词
  if (currentSpellingIndex.value >= spellingWords.value.length) {
    // 检查是否有拼错的单词需要重新练习
    if (incorrectWords.value.length > 0) {
      // 重新练习拼错的单词
      spellingWords.value = shuffleArray([...incorrectWords.value]);
      incorrectWords.value = [];
      currentSpellingIndex.value = 0;
      retryCount.value++;
    } else {
      // 所有单词都拼写正确，切换到拼写完成模式
      emit('spellingCompleted');
    }
  }
};

// 处理拼写退出
const handleSpellingExit = () => {
  emit('rest'); // 退出拼写，相当于选择休息
  emit('close');
};

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
@import '../assets/css/studyProgressModal.css';
</style>
