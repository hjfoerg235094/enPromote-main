<template>
  <VocabularyCard v-if="showVocabularyCard" @next="nextWord" @favorite-changed="handleFavoriteChanged" :word="currentWord" :wordData="currentWordData"
    :loading="isLoadingWordData" :chineseMeaning="currentMeaning" :wordId="currentWordId" />

  <!-- 学习进度弹窗 -->
  <StudyProgressModal :visible="showProgressModal" :wordsCount="completedWordsCount" :startTime="studyStartTime"
    :mode="progressModalMode" :wordsList="words" @rest="handleProgressModalRest" @continue="handleProgressModalContinue"
    @startSpelling="handleStartSpelling" @spellingCompleted="handleSpellingCompleted"
    @close="handleProgressModalClose" />

  <div class="vocabulary-container">
    <!-- 主页面 - 选择模式 -->
    <div class="mode-selection" v-if="currentMode === 'select'">
      <div class="welcome-section">
        <div class="welcome-icon">📚</div>
        <h1 class="welcome-title">词汇练习</h1>
        <p class="welcome-subtitle">选择你的学习模式，开始词汇之旅</p>
      </div>

      <div class="mode-cards">
        <div class="mode-card practice-card" @click="startPractice">
          <div class="card-icon">🚀</div>
          <h3 class="card-title">开始练习</h3>
          <p class="card-description">学习新单词，扩展词汇量</p>
          <div class="card-arrow">→</div>
        </div>

        <div class="mode-card review-card" @click="startReview">
          <div class="card-icon">🔄</div>
          <h3 class="card-title">开始复习</h3>
          <p class="card-description">复习已学单词，巩固记忆</p>
          <div class="card-arrow">→</div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">{{ totalReviewWords }}</div>
          <div class="stat-label">已学单词</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ todayStudiedWords }}</div>
          <div class="stat-label">今日学习</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ streakDays }}</div>
          <div class="stat-label">连续天数</div>
        </div>
      </div>
    </div>

    <!-- 练习模式 -->
    <div class="practice-mode" v-if="currentMode === 'practice' || currentMode === 'review'">
      <div class="practice-header">
        <div class="progress-info">
          <span class="progress-text">{{ currentMode === 'practice' ? '练习模式' : '复习模式' }}</span>
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

        <div class="quick-actions">
          <button class="quick-btn" @click="showMeaning = false; currentMode = 'select'">
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import VocabularyCard from '@/components/vocabularyCard.vue';
import StudyProgressModal from '@/components/StudyProgressModal.vue';
import { ref, computed, onMounted } from 'vue';
import { getUserInfo } from '@/api/auth';
import { getWordList, updateWordProgress, getWordInfo, updateWordPriority, getReviewWords } from '@/api/word';
import axios from 'axios';
import { toast } from '@/utils/toastService';

// 用户信息及进度
const userInfo = ref({});
const currentLetter = ref('A');
const currentIndex = ref(0);
const showMeaning = ref(false);
const showMeaned = ref(false);

// 统计数据
const reviewWords = ref([]);
const totalReviewWords = ref(0);
const todayStudiedWords = ref(0);
const streakDays = ref(0);

// 单词数据
const words = ref([]);
const currentWordIndex = ref(0);
// VocabularyCard相关状态
const showVocabularyCard = ref(false);
const currentWordData = ref({});
const isLoadingWordData = ref(false);

// 当前模式：select（选择页面）, practice（练习模式）, review（复习模式）, spelling（拼写模式）
const currentMode = ref('select');

// 学习进度弹窗相关状态
const showProgressModal = ref(false);
const studyStartTime = ref(null);
const completedWordsCount = ref(0);
const progressModalMode = ref('completed'); // 'completed', 'spelling', 'spellingCompleted'



// 获取单词数据
const getWordData = async (params) => {
  isLoadingWordData.value = true;
  try {
    const res = await getWordInfo(params);
    console.log('返回的单词数据res:', res);
    currentWordData.value = res.data;
    // 从返回数据中获取wordId
    if (res.data.wordId) {
      currentWordId.value = res.data.wordId;
      console.log('获取到wordId:', res.data.wordId);
    }
    console.log('currentWordData.value:', currentWordData.value);
  } catch (error) {
    console.error('获取单词数据失败:', error);
    if (error.code === 'ECONNABORTED') {
      console.log('请求超时，请检查网络连接');
    } else if (error.response?.status === 404) {
      console.log('网络连接错误，请检查网络连接');
    } else {
      console.log('服务器错误:', error.response?.data?.message || error.message);
    }
  } finally {
    isLoadingWordData.value = false;
  }
};

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 获取复习单词数量
    const reviewRes = await getReviewWords();
    console.log('reviewRes:', reviewRes);

    if (reviewRes.data.code === 200) {
      reviewWords.value = reviewRes.data.data || [];
    }

    // 重新获取用户信息以获取最新的统计数据
    const userRes = await getUserInfo();
    if (userRes.status === 200) {
      todayStudiedWords.value = userRes.data.todayWords || 0;
      streakDays.value = userRes.data.streakDays || 0;
      totalReviewWords.value = userRes.data.totalWords || 0;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 加载用户信息和进度 并更新用户今日单词
onMounted(async () => {
  try {
    const res = await getUserInfo();
    if (res.status === 200) {
      userInfo.value = res.data;
      console.log('userInfo:', userInfo.value);
      // 从进度中提取字母和索引
      if (userInfo.value.cet4 && userInfo.value.cet4.position) {
        const progress = userInfo.value.cet4.position.split(':');
        if (progress.length === 2) {
          currentLetter.value = progress[0];
          currentIndex.value = parseInt(progress[1]) || 0;
        }
      }

      // 预加载单词列表
      await loadWordList();

      // 加载统计数据
      await loadStatistics();
      // 更新今日单词数
      await updateWordProgress({ studyWords: 0 });
      // todayStudiedWords.value = 0;

    }
  } catch (error) {
    console.error('获取用户信息失败', error);
  }
});

// 加载单词列表
async function loadWordList() {
  try {
    // 使用查询参数请求单词
    console.log('currentValue:', currentLetter.value, currentIndex.value);
    const response = await getWordList({
      letter: currentLetter.value,
      index: currentIndex.value
    });
    console.log(response);
    if (response.status === 200) {
      words.value = response.data.data.words;
      console.log('加载的单词列表:', words.value);
    } else {
      console.error('加载单词列表失败:', response.message);
    }

    // 重置单词索引
    currentWordIndex.value = 0;

  } catch (error) {
    console.error('请求单词列表错误:', error);
  }
}
async function loadReviewList() {
  try {
    const response = await getReviewWords().then(req => {
      return req.data
    })
    console.log('review=', response);

    // 检查是否有复习单词
    if (!response.data.words || response.data.wordListLen === 0) {
      toast.info('暂无需要复习的单词！');
      currentMode.value = 'select'; // 返回选择模式
      return;
    }


    words.value = response.data.words;
    currentIndex.value = 0;
    studyStartTime.value = new Date(); // 记录开始时间
    completedWordsCount.value = 0; // 重置完成单词数

  } catch (err) {
    console.log('review请求失败' + err);
    toast.error('获取复习单词失败，请重试');
  }
}

// 计算属性：当前显示的单词
const currentWord = computed(() => {
  if (!words.value || words.value.length === 0) {
    return '加载中...';
  }

  if (currentWordIndex.value >= words.value.length) {
    return '本组单词学习完成';
  }

  // 处理新的单词格式（对象）或旧格式（字符串）
  const wordItem = words.value[currentWordIndex.value];
  return typeof wordItem === 'string' ? wordItem : wordItem.word;
});

// 计算属性：当前单词的ID
const currentWordId = computed(() => {
  if (!words.value || words.value.length === 0 || currentWordIndex.value >= words.value.length) {
    return '';
  }

  const wordItem = words.value[currentWordIndex.value];
  console.log('当前单词项:', wordItem);
  // 如果单词项是对象且包含_id，直接返回
  if (typeof wordItem === 'object' && wordItem._id) {
    return wordItem._id;
  }
  // 如果单词项是对象但不包含_id，或者只是字符串，返回空字符串
  return '';
});

// 计算属性：当前单词的释义（根据新格式获取中文释义）
const currentMeaning = computed(() => {
  if (!words.value || words.value.length === 0 || currentWordIndex.value >= words.value.length) {
    return '';
  }

  const wordItem = words.value[currentWordIndex.value];
  // 如果是新格式（对象），返回mean属性，否则返回空字符串
  console.log('wordItem=', wordItem.mean);

  return typeof wordItem === 'object' && wordItem.mean ? wordItem.mean : '';
});

// 计算属性：当前单词的音标
const currentPhonetic = computed(() => {
  if (!words.value || words.value.length === 0 || currentWordIndex.value >= words.value.length) {
    return '';
  }

  const wordItem = words.value[currentWordIndex.value];
  // 如果是新格式（对象），返回phonetic_symbol属性，否则返回空字符串
  return typeof wordItem === 'object' && wordItem.phonetic_symbol ? wordItem.phonetic_symbol : '';
});

// 计算进度百分比
const progressPercentage = computed(() => {
  if (!words.value || words.value.length === 0) return 0;
  return Math.round(((currentWordIndex.value + 1) / words.value.length) * 100);
});

// 切换释义显示
const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value;
  showMeaned.value = true
};

// 开始练习模式
const startPractice = async () => {
  currentMode.value = 'practice';
  studyStartTime.value = new Date(); // 记录开始学习时间
  completedWordsCount.value = 0; // 重置完成单词数
  await loadWordList(); // 确保加载了最新的单词列表
  currentWordIndex.value = 0;
  showMeaning.value = false;
};

// 开始复习模式
const startReview = async () => {
  currentMode.value = 'review';
  await loadReviewList();
  currentWordIndex.value = 0;
  showMeaning.value = false;
};

// 处理"认识"按钮点击
const handleKnow = async () => {
  // 此处可添加逻辑，例如将单词标记为已掌握
  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;

  try {
    // 标记为认识
    await updateWordPriority({
      word: wordToQuery,
      newStatus: 'know',
      isCorrect: true
    });
  } catch (error) {
    console.error('更新单词状态失败:', error);
  }
  
  nextWord();
};

// 处理"模糊"按钮点击
const handleVague = async () => {
  showVocabularyCard.value = true;
  // 立即清空当前单词数据，避免显示上一个单词的内容
  currentWordData.value = {};

  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;
  
  // 获取单词详细信息并弹出卡片
  getWordData({ word: wordToQuery });
  
  try {
    // 更新单词优先级为模糊
    await updateWordPriority({
      word: wordToQuery,
      newStatus: 'vague',
      isCorrect: false
    });
  } catch (error) {
    console.error('更新单词状态失败:', error);
  }
};

// 处理"不认识"按钮点击
const handleUnknown = async () => {
  showVocabularyCard.value = true;
  // 立即清空当前单词数据，避免显示上一个单词的内容
  currentWordData.value = {};

  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;

  // 获取单词详细信息并弹出卡片
  getWordData({ word: wordToQuery });

  try {
    // 更新单词优先级为不认识
    await updateWordPriority({
      word: wordToQuery,
      newStatus: 'unknown',
      isCorrect: false
    });
  } catch (error) {
    console.error('更新单词状态失败:', error);
  }
};

// 切换到下一个单词
const nextWord = async () => {
  showMeaned.value = false;
  if (currentWordIndex.value < words.value.length - 1) {
    currentWordIndex.value += 1;
    showMeaning.value = false;
    showVocabularyCard.value = false; // 关闭词汇卡片
  } else {
    // 当前批次单词学习完成，隐藏单词卡片并更新进度
    showMeaning.value = false;
    currentIndex.value += words.value.length;
    completedWordsCount.value = words.value.length;

    // 更新用户进度（实际项目中应调用API保存进度）
    const studyWords = words.value.length;
    const res = await updateWordProgress({ studyWords });
    if (res.status === 200) {
      console.log('进度更新成功');

      // 更新今日学习数量
      todayStudiedWords.value += words.value.length;

      // 计算学习时长（分钟）
      const studyEndTime = new Date();
      let studyDuration = 0;
      
      if (studyStartTime.value) {
        studyDuration = Math.round((studyEndTime - studyStartTime.value) / 1000 / 60);
        console.log('学习时长:', studyDuration, '分钟');
      } else {
        console.warn('学习开始时间未设置');
      }

      // 记录学习时长
      if (studyDuration > 0) {
        await recordStudyTime(
          currentMode.value === 'practice' ? 'vocabulary' : 'review',
          studyDuration,
          currentMode.value === 'practice' ? words.value.length : 0,
          currentMode.value === 'review' ? words.value.length : 0,
          0
        );
      }

      // 显示学习进度弹窗，默认为完成模式
      progressModalMode.value = 'completed';
      showProgressModal.value = true;
    } else {
      toast.error('更新失败，请重试');
    }
  }
};

// 处理学习进度弹窗事件
const handleProgressModalRest = () => {
  // 用户选择休息，完全重置状态并返回选择页面
  showProgressModal.value = false;
  showMeaning.value = false;
  showVocabularyCard.value = false; // 关闭单词卡片
  currentMode.value = 'select';
  currentWordIndex.value = 0;
  words.value = [];
  completedWordsCount.value = 0;
  progressModalMode.value = 'completed';
  studyStartTime.value = null;
};

// 处理学习进度弹窗关闭事件
const handleProgressModalClose = () => {
  // 用户通过其他方式关闭弹窗，也需要重置状态
  handleProgressModalRest();
};

const handleProgressModalContinue = async () => {
  // 用户选择继续学习，加载下一批单词
  showProgressModal.value = false;
  showVocabularyCard.value = false; // 关闭单词卡片
  studyStartTime.value = new Date(); // 重新记录开始时间
  completedWordsCount.value = 0; // 重置完成单词数

  if (currentMode.value === 'practice') {
    await loadWordList(); // 加载新的单词列表
  } else if (currentMode.value === 'review') {
    await loadReviewList(); // 加载新的复习单词列表
  }

  currentWordIndex.value = 0;
  showMeaning.value = false;

  // 重新加载统计数据
  await loadStatistics();
};

// 处理开始拼写
const handleStartSpelling = () => {
  progressModalMode.value = 'spelling';
};

// 处理拼写完成
const handleSpellingCompleted = () => {
  progressModalMode.value = 'spellingCompleted';
};

// 处理收藏状态变化
const handleFavoriteChanged = (data) => {
  console.log('收藏状态变化:', data);
  // 调用个人主页的刷新方法，更新收藏列表
  if (window.refreshFavoriteWords) {
    window.refreshFavoriteWords();
  }
};

// 记录学习时长
const recordStudyTime = async (moduleType, studyTime, newWords = 0, reviewWords = 0, accuracy = 0) => {
  try {
    const response = await axios.post('/api/report/record', {
      module: moduleType,
      studyTime: studyTime,
      newWords: newWords,
      reviewWords: reviewWords,
      accuracy: accuracy,
      startTime: studyStartTime.value,
      endTime: new Date()
    });
    console.log('学习时长记录成功:', response.data);
  } catch (error) {
    console.error('记录学习时长失败:', error);
  }
};
</script>

<style scoped>
@import '../assets/css/vocabulary.css';
@import '../assets/css/vocabularyUpdate.css';
</style>
