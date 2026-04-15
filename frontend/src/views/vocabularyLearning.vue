
<template>
  <div class="vocabulary-learning-container">
    <!-- 学习进度弹窗 -->
    <StudyProgressModal 
      :visible="showProgressModal" 
      :wordsCount="completedWordsCount" 
      :startTime="studyStartTime"
      :mode="progressModalMode" 
      :wordsList="words" 
      @rest="handleProgressModalRest" 
      @continue="handleProgressModalContinue"
      @close="handleProgressModalClose" 
    />

    <!-- 主页面 - 选择模式 -->
    <div class="mode-selection" v-if="currentMode === 'select'">
      <div class="welcome-section">
        <div class="welcome-icon">📚</div>
        <h1 class="welcome-title">词汇学习</h1>
        <p class="welcome-subtitle">选择你的学习模式，开始词汇之旅</p>
      </div>

      <!-- 学习统计 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">{{ statistics.totalLearned || 0 }}</div>
          <div class="stat-label">已学单词</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.todayLearned || 0 }}</div>
          <div class="stat-label">今日学习</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ statistics.streakDays || 0 }}</div>
          <div class="stat-label">连续天数</div>
        </div>
      </div>

      <!-- 章节选择 -->
      <div class="chapter-selection" v-if="progress">
        <h3 class="section-title">当前学习进度</h3>
        <div class="progress-card">
          <div class="chapter-info">
            <div class="chapter-label">章节 {{ progress.currentChapter }}</div>
            <div class="chapter-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress.chapterProgress + '%' }"></div>
              </div>
              <div class="progress-text">{{ progress.currentIndex }} / {{ progress.chapterTotal }}</div>
            </div>
          </div>
          <button class="next-chapter-btn" @click="handleNextChapter" :disabled="progress.isLastChapter">
            下一章 →
          </button>
        </div>
      </div>

      <!-- 学习模式卡片 -->
      <div class="mode-cards">
        <div class="mode-card practice-card" @click="startPractice">
          <div class="card-icon">🚀</div>
          <h3 class="card-title">开始学习</h3>
          <p class="card-description">学习新单词，扩展词汇量</p>
          <div class="card-arrow">→</div>
        </div>

        <div class="mode-card review-card" @click="startReview">
          <div class="card-icon">🔄</div>
          <h3 class="card-title">开始复习</h3>
          <p class="card-description">复习已学单词，巩固记忆</p>
          <div class="card-badge" v-if="reviewCount > 0">{{ reviewCount }}个待复习</div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- 学习/复习模式 -->
    <div class="learning-mode" v-if="currentMode === 'practice' || currentMode === 'review'">
      <div class="learning-header">
        <button class="back-btn" @click="handleBack">
          ← 返回
        </button>
        <div class="progress-info">
          <span class="progress-text">{{ currentMode === 'practice' ? '学习模式' : '复习模式' }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-count">{{ currentWordIndex + 1 }} / {{ words.length }}</span>
        </div>
      </div>

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

            <!-- 发音练习组件 -->
            <OralPractice
              v-if="currentWord && currentWord !== '加载中...' && currentWord !== '本组单词学习完成'"
              :text="currentWord"
              category="word"
            />
          </div>
        </div>
      </div>

      <div class="action-section">
        <div class="action-buttons">
          <button class="action-btn know-btn" @click="handleKnow">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import StudyProgressModal from '@/components/StudyProgressModal.vue';
import OralPractice from '@/components/OralPractice.vue';
import axios from 'axios';
import {
  getLearningProgress,
  getLearningWords,
  updateLearningProgress,
  recordWordLearning,
  getReviewWords,
  moveToNextChapter,
  getLearningStatistics
} from '@/api/vocabularyLearning';

// 学习模式：select（选择页面）, practice（学习模式）, review（复习模式）
const currentMode = ref('select');

// 学习进度
const progress = ref(null);
const statistics = ref({});
const reviewCount = ref(0);

// 单词数据
const words = ref([]);
const currentWordIndex = ref(0);
const showMeaning = ref(false);

// 学习进度弹窗相关状态
const showProgressModal = ref(false);
const studyStartTime = ref(null);
const completedWordsCount = ref(0);
const progressModalMode = ref('completed');

// 加载学习进度和统计
const loadProgress = async () => {
  try {
    const [progressRes, statsRes] = await Promise.all([
      getLearningProgress(),
      getLearningStatistics()
    ]);

    if (progressRes.data.code === 200) {
      progress.value = progressRes.data.data;
    }

    if (statsRes.data.code === 200) {
      statistics.value = statsRes.data.data;
    }
  } catch (error) {
    console.error('加载学习进度失败:', error);
  }
};

// 加载复习单词数量
const loadReviewCount = async () => {
  try {
    const res = await getReviewWords({ limit: 1 });
    if (res.data.code === 200) {
      reviewCount.value = res.data.data.count;
    }
  } catch (error) {
    console.error('加载复习单词数量失败:', error);
  }
};

// 加载单词列表
const loadWordList = async () => {
  try {
    const chapter = progress.value?.currentChapter || 'A';
    const startIndex = progress.value?.currentIndex || 0;

    const res = await getLearningWords({
      chapter,
      startIndex,
      count: 20
    });

    if (res.data.code === 200) {
      words.value = res.data.data.words;
      currentWordIndex.value = 0;
      showMeaning.value = false;
    }
  } catch (error) {
    console.error('加载单词列表失败:', error);
  }
};

// 开始学习模式
const startPractice = async () => {
  currentMode.value = 'practice';
  studyStartTime.value = new Date();
  completedWordsCount.value = 0;
  await loadWordList();
};

// 开始复习模式
const startReview = async () => {
  try {
    const res = await getReviewWords({ limit: 20 });

    if (res.data.code === 200) {
      if (res.data.data.words.length === 0) {
        alert('暂无需要复习的单词！');
        return;
      }

      words.value = res.data.data.words;
      currentWordIndex.value = 0;
      showMeaning.value = false;
      currentMode.value = 'review';
      studyStartTime.value = new Date();
      completedWordsCount.value = 0;
    }
  } catch (error) {
    console.error('加载复习单词失败:', error);
    alert('加载复习单词失败，请重试');
  }
};

// 切换到下一章节
const handleNextChapter = async () => {
  try {
    const res = await moveToNextChapter();

    if (res.data.code === 200) {
      if (res.data.data.isLastChapter) {
        alert('已经是最后一章了！');
      } else {
        await loadProgress();
      }
    }
  } catch (error) {
    console.error('切换章节失败:', error);
    alert('切换章节失败，请重试');
  }
};

// 处理"认识"按钮点击
const handleKnow = async () => {
  const word = currentWord.value;

  try {
    await recordWordLearning({
      word,
      status: 'know'
    });

    nextWord();
  } catch (error) {
    console.error('记录单词学习结果失败:', error);
  }
};

// 处理"模糊"按钮点击
const handleVague = async () => {
  showMeaning.value = true;

  const word = currentWord.value;

  try {
    await recordWordLearning({
      word,
      status: 'vague'
    });
  } catch (error) {
    console.error('记录单词学习结果失败:', error);
  }
};

// 处理"不认识"按钮点击
const handleUnknown = async () => {
  showMeaning.value = true;

  const word = currentWord.value;

  try {
    await recordWordLearning({
      word,
      status: 'unknown'
    });
  } catch (error) {
    console.error('记录单词学习结果失败:', error);
  }
};

// 切换到下一个单词
const nextWord = async () => {
  showMeaning.value = false;

  if (currentWordIndex.value < words.value.length - 1) {
    currentWordIndex.value += 1;
  } else {
    // 当前批次单词学习完成
    completedWordsCount.value = words.value.length;

    try {
      const chapter = progress.value?.currentChapter || 'A';
      const currentIndex = progress.value?.currentIndex || 0;
      const newIndex = currentIndex + words.value.length;

      const res = await updateLearningProgress({
        studiedWords: words.value.length,
        chapter,
        newIndex
      });

      if (res.data.code === 200) {
        // 更新学习进度
        await loadProgress();

        // 计算学习时长（分钟）
        const endTime = new Date();
        const studyTimeMinutes = Math.floor((endTime - studyStartTime.value) / (1000 * 60));

        // 记录学习时长到每日报告
        try {
          await axios.post('/api/report/record', {
            module: currentMode.value === 'practice' ? 'vocabulary' : 'vocabulary',
            studyTime: studyTimeMinutes,
            newWords: currentMode.value === 'practice' ? words.value.length : 0,
            reviewWords: currentMode.value === 'review' ? words.value.length : 0,
            startTime: studyStartTime.value,
            endTime: endTime
          });
        } catch (error) {
          console.error('记录学习时长失败:', error);
        }

        // 显示学习进度弹窗
        progressModalMode.value = 'completed';
        showProgressModal.value = true;
      }
    } catch (error) {
      console.error('更新学习进度失败:', error);
      alert('更新学习进度失败，请重试');
    }
  }
};

// 处理学习进度弹窗事件
const handleProgressModalRest = () => {
  showProgressModal.value = false;
  currentMode.value = 'select';
  showMeaning.value = false;
};

const handleProgressModalContinue = () => {
  showProgressModal.value = false;
  showMeaning.value = false;
  // 继续学习，加载下一批单词
  loadWordList();
};

const handleProgressModalClose = () => {
  showProgressModal.value = false;
  showMeaning.value = false;
};

// 返回选择页面
const handleBack = () => {
  currentMode.value = 'select';
  showMeaning.value = false;
};

// 切换释义显示
const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value;
};

// 计算属性：当前显示的单词
const currentWord = computed(() => {
  if (!words.value || words.value.length === 0) {
    return '加载中...';
  }

  if (currentWordIndex.value >= words.value.length) {
    return '本组单词学习完成';
  }

  const wordItem = words.value[currentWordIndex.value];
  return typeof wordItem === 'string' ? wordItem : wordItem.word;
});

// 计算属性：当前单词的释义
const currentMeaning = computed(() => {
  if (!words.value || words.value.length === 0 || currentWordIndex.value >= words.value.length) {
    return '';
  }

  const wordItem = words.value[currentWordIndex.value];

  // 如果是复习模式，使用detail中的信息
  if (currentMode.value === 'review' && wordItem.detail) {
    return typeof wordItem.detail === 'string' ? '' : wordItem.detail.mean || '';
  }

  // 学习模式，使用mean属性
  return typeof wordItem === 'object' && wordItem.mean ? wordItem.mean : '';
});

// 计算属性：当前单词的音标
const currentPhonetic = computed(() => {
  if (!words.value || words.value.length === 0 || currentWordIndex.value >= words.value.length) {
    return '';
  }

  const wordItem = words.value[currentWordIndex.value];

  // 如果是复习模式，使用detail中的信息
  if (currentMode.value === 'review' && wordItem.detail) {
    return typeof wordItem.detail === 'string' ? '' : wordItem.detail.phonetic_symbol || '';
  }

  // 学习模式，使用phonetic_symbol属性
  return typeof wordItem === 'object' && wordItem.phonetic_symbol ? wordItem.phonetic_symbol : '';
});

// 计算进度百分比
const progressPercentage = computed(() => {
  if (!words.value || words.value.length === 0) return 0;
  return Math.round(((currentWordIndex.value + 1) / words.value.length) * 100);
});

// 页面加载时获取学习进度和统计
onMounted(async () => {
  await loadProgress();
  await loadReviewCount();
});
</script>

<style scoped>
.vocabulary-learning-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.mode-selection {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.welcome-title {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.welcome-subtitle {
  font-size: 18px;
  opacity: 0.9;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.chapter-selection {
  margin-bottom: 30px;
}

.section-title {
  color: white;
  font-size: 24px;
  margin-bottom: 15px;
}

.progress-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chapter-info {
  flex: 1;
}

.chapter-label {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.chapter-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.next-chapter-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: transform 0.2s;
}

.next-chapter-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.next-chapter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.mode-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

.mode-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.card-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.card-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
}

.card-arrow {
  font-size: 24px;
  color: #667eea;
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff6b6b;
  color: white;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.learning-mode {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.learning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
}

.progress-text {
  font-size: 16px;
  font-weight: bold;
}

.progress-count {
  font-size: 14px;
  opacity: 0.9;
}

.word-display-area {
  background: white;
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.word-card {
  text-align: center;
}

.word-main {
  margin-bottom: 20px;
}

.word-text {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.phonetic {
  font-size: 20px;
  color: #666;
  font-style: italic;
}

.word-actions {
  margin-bottom: 20px;
}

.hint-btn {
  padding: 10px 20px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.hint-btn:hover {
  background: #e0e0e0;
}

.hint-btn.active {
  background: #667eea;
  color: white;
}

.meaning-section {
  padding: 20px 0 0 0;
  border-top: 1px solid #f0f0f0;
}

.meaning-content {
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.meaning-text {
  font-size: 18px;
  color: #333;
  line-height: 1.6;
}

.action-section {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.action-btn {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.know-btn {
  background: #4caf50;
  color: white;
}

.vague-btn {
  background: #ff9800;
  color: white;
}

.unknown-btn {
  background: #f44336;
  color: white;
}

.btn-icon {
  font-size: 24px;
}

.btn-text {
  font-size: 14px;
}
</style>
