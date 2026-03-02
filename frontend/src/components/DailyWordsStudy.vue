<template>
  <div class="daily-words-container">
    <!-- 页面头部 -->
    <div class="daily-header">
      <h2 class="daily-title">今日单词学习</h2>
      <div class="daily-date">{{ formattedDate }}</div>
    </div>

    <!-- 学习进度 -->
    <div class="progress-section">
      <div class="progress-info">
        <span class="progress-text">学习进度：{{ currentIndex + 1 }} / {{ dailyWords.length }}</span>
        <span class="progress-percentage">{{ progressPercentage }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>

    <!-- 单词卡片 -->
    <div class="word-card-container" v-if="currentWord">
      <div class="word-card">
        <div class="word-main">
          <h3 class="word-text">{{ currentWord.word }}</h3>
          <button class="audio-btn" @click="playAudio">
            <span class="audio-icon">🔊</span>
          </button>
        </div>
        <div class="word-meaning">
          <p>{{ currentWord.mean || "正在加载释义..." }}</p>
        </div>
        <div class="word-actions">
          <button class="action-btn know-btn" @click="markAsKnown">
            认识
          </button>
          <button class="action-btn unknown-btn" @click="markAsUnknown">
            不认识
          </button>
        </div>
      </div>
    </div>

    <!-- 学习完成 -->
    <div class="study-complete" v-if="isStudyComplete">
      <div class="complete-content">
        <div class="complete-icon">🎉</div>
        <h3>今日学习完成！</h3>
        <p>恭喜你完成了今天的40个单词学习</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ knownWordsCount }}</span>
            <span class="stat-label">已掌握</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ unknownWordsCount }}</span>
            <span class="stat-label">需加强</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="action-btn review-btn" @click="startReview">
            复习不认识的单词
          </button>
          <button class="action-btn continue-btn" @click="goToNextStep">
            继续下一步学习
          </button>
        </div>
      </div>
    </div>

    <!-- 复习模式 -->
    <div class="review-mode" v-if="isReviewMode && reviewWords.length > 0">
      <div class="review-header">
        <h3>复习模式</h3>
        <p>复习你标记为"不认识"的单词</p>
      </div>
      <div class="review-word-card" v-if="currentReviewWord">
        <div class="word-main">
          <h3 class="word-text">{{ currentReviewWord.word }}</h3>
          <button class="audio-btn" @click="playReviewAudio">
            <span class="audio-icon">🔊</span>
          </button>
        </div>
        <div class="word-meaning">
          <p>{{ currentReviewWord.mean || "正在加载释义..." }}</p>
        </div>
        <div class="word-actions">
          <button class="action-btn know-btn" @click="markReviewAsKnown">
            已掌握
          </button>
          <button class="action-btn unknown-btn" @click="nextReviewWord">
            继续复习
          </button>
        </div>
      </div>
      <div class="review-complete" v-if="isReviewComplete">
        <div class="complete-content">
          <div class="complete-icon">👏</div>
          <h3>复习完成！</h3>
          <p>你已经复习了所有需要加强的单词</p>
          <button class="action-btn continue-btn" @click="finishReview">
            完成今日学习
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="isLoading">
      <div class="loading-spinner"></div>
      <p>正在加载今日单词...</p>
    </div>

    <!-- 错误提示 -->
    <div class="error-container" v-if="errorMessage">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="loadDailyWords">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getDailyWords, getWordAudio, updateWordProgress } from '@/api/word';

const router = useRouter();

// 响应式数据
const dailyWords = ref([]);
const currentIndex = ref(0);
const knownWords = ref([]);
const unknownWords = ref([]);
const isStudyComplete = ref(false);
const isReviewMode = ref(false);
const reviewWords = ref([]);
const currentReviewIndex = ref(0);
const isReviewComplete = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');
const audioUrl = ref('');

// 计算属性
const currentWord = computed(() => {
  if (dailyWords.value.length === 0 || currentIndex.value >= dailyWords.value.length) {
    return null;
  }
  return dailyWords.value[currentIndex.value];
});

const currentReviewWord = computed(() => {
  if (reviewWords.value.length === 0 || currentReviewIndex.value >= reviewWords.value.length) {
    return null;
  }
  return reviewWords.value[currentReviewIndex.value];
});

const progressPercentage = computed(() => {
  if (dailyWords.value.length === 0) return 0;
  return Math.round((currentIndex.value / dailyWords.value.length) * 100);
});

const reviewProgressPercentage = computed(() => {
  if (reviewWords.value.length === 0) return 0;
  return Math.round((currentReviewIndex.value / reviewWords.value.length) * 100);
});

const knownWordsCount = computed(() => knownWords.value.length);
const unknownWordsCount = computed(() => unknownWords.value.length);

const formattedDate = computed(() => {
  const today = new Date();
  return today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
});

// 页面加载时获取每日单词
onMounted(() => {
  loadDailyWords();
});

// 加载每日单词
const loadDailyWords = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const response = await getDailyWords();

    if (response.data && response.data.code === 200) {
      dailyWords.value = response.data.data.words || [];

      // 如果没有单词，显示提示信息
      if (dailyWords.value.length === 0) {
        errorMessage.value = '今日没有可学习的单词，请明天再来！';
      }
    } else {
      errorMessage.value = response.data?.message || '获取每日单词失败';
    }
  } catch (error) {
    console.error('获取每日单词失败:', error);
    errorMessage.value = '网络错误，请检查网络连接后重试';
  } finally {
    isLoading.value = false;
  }
};

// 标记为已认识
const markAsKnown = () => {
  if (currentWord.value) {
    knownWords.value.push(currentWord.value);
    nextWord();
  }
};

// 标记为不认识
const markAsUnknown = () => {
  if (currentWord.value) {
    unknownWords.value.push(currentWord.value);
    nextWord();
  }
};

// 下一个单词
const nextWord = () => {
  currentIndex.value++;

  // 检查是否完成所有单词学习
  if (currentIndex.value >= dailyWords.value.length) {
    completeStudy();
  }
};

// 完成学习
const completeStudy = () => {
  isStudyComplete.value = true;

  // 更新学习进度
  updateWordProgress({
    studyWords: dailyWords.value.length
  }).catch(error => {
    console.error('更新学习进度失败:', error);
  });
};

// 开始复习
const startReview = () => {
  if (unknownWords.value.length > 0) {
    isReviewMode.value = true;
    reviewWords.value = [...unknownWords.value];
    currentReviewIndex.value = 0;
  } else {
    // 没有需要复习的单词，直接完成
    finishStudy();
  }
};

// 下一个复习单词
const nextReviewWord = () => {
  currentReviewIndex.value++;

  // 检查是否完成复习
  if (currentReviewIndex.value >= reviewWords.value.length) {
    completeReview();
  }
};

// 标记复习单词为已掌握
const markReviewAsKnown = () => {
  if (currentReviewWord.value) {
    // 从未知单词中移除
    const index = unknownWords.value.findIndex(
      word => word.word === currentReviewWord.value.word
    );
    if (index !== -1) {
      unknownWords.value.splice(index, 1);
    }

    nextReviewWord();
  }
};

// 完成复习
const completeReview = () => {
  isReviewComplete.value = true;
};

// 完成复习
const finishReview = () => {
  finishStudy();
};

// 完成今日学习
const finishStudy = () => {
  // 跳转到学习完成页面或主页
  router.push('/home');
};

// 继续下一步学习
const goToNextStep = () => {
  // 根据学习进度跳转到相应页面
  router.push('/vocabulary');
};

// 播放单词音频
const playAudio = async () => {
  if (!currentWord.value) return;

  try {
    const response = await getWordAudio({ word: currentWord.value.word });
    if (response.data && response.data.code === 200) {
      audioUrl.value = response.data.data;
      const audio = new Audio(audioUrl.value);
      audio.play().catch(error => {
        console.error('音频播放失败:', error);
      });
    }
  } catch (error) {
    console.error('获取单词音频失败:', error);
  }
};

// 播放复习单词音频
const playReviewAudio = async () => {
  if (!currentReviewWord.value) return;

  try {
    const response = await getWordAudio({ word: currentReviewWord.value.word });
    if (response.data && response.data.code === 200) {
      audioUrl.value = response.data.data;
      const audio = new Audio(audioUrl.value);
      audio.play().catch(error => {
        console.error('音频播放失败:', error);
      });
    }
  } catch (error) {
    console.error('获取单词音频失败:', error);
  }
};
</script>

<style scoped>
.daily-words-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.daily-header {
  text-align: center;
  margin-bottom: 30px;
}

.daily-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.daily-date {
  font-size: 16px;
  color: #666;
}

.progress-section {
  margin-bottom: 30px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-text, .progress-percentage {
  font-size: 16px;
  color: #555;
}

.progress-bar {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.word-card-container {
  margin-bottom: 30px;
}

.word-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

.word-main {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.word-text {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.audio-btn {
  background: none;
  border: none;
  margin-left: 15px;
  cursor: pointer;
  padding: 5px;
}

.audio-icon {
  font-size: 24px;
}

.word-meaning {
  margin-bottom: 30px;
}

.word-meaning p {
  font-size: 18px;
  color: #555;
  line-height: 1.5;
}

.word-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.know-btn {
  background-color: #4CAF50;
  color: white;
}

.know-btn:hover {
  background-color: #45a049;
}

.unknown-btn {
  background-color: #f44336;
  color: white;
}

.unknown-btn:hover {
  background-color: #d32f2f;
}

.study-complete, .review-complete {
  text-align: center;
  padding: 40px 20px;
}

.complete-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.complete-content h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.complete-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.review-btn {
  background-color: #2196F3;
  color: white;
}

.review-btn:hover {
  background-color: #0b7dda;
}

.continue-btn {
  background-color: #4CAF50;
  color: white;
}

.continue-btn:hover {
  background-color: #45a049;
}

.review-mode {
  margin-top: 30px;
}

.review-header {
  text-align: center;
  margin-bottom: 20px;
}

.review-header h3 {
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.review-header p {
  font-size: 16px;
  color: #666;
}

.review-word-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.error-message {
  background-color: #ffebee;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 10px;
  display: block;
}

.error-message p {
  color: #d32f2f;
  margin-bottom: 15px;
}

.retry-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background-color: #d32f2f;
}

@media (max-width: 768px) {
  .daily-words-container {
    padding: 15px;
  }

  .daily-title {
    font-size: 24px;
  }

  .word-text {
    font-size: 28px;
  }

  .word-meaning p {
    font-size: 16px;
  }

  .word-actions {
    flex-direction: column;
    gap: 15px;
  }

  .action-btn {
    width: 100%;
  }

  .complete-stats {
    gap: 30px;
  }

  .complete-actions {
    flex-direction: column;
    gap: 15px;
  }

  .complete-actions .action-btn {
    width: 100%;
  }
}
</style>
