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
      <button 
        class="favorite-btn" 
        @click="toggleFavorite" 
        :class="{ active: isFavorite }"
        :disabled="favoriteLoading"
        :title="isFavorite ? '取消收藏' : '添加收藏'"
      >
        {{ favoriteLoading ? '...' : (isFavorite ? '⭐' : '☆') }}
      </button>
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
        <button class="quick-btn" @click="showMeaning = false; $emit('back')">
          🏠 返回地图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getWordList, updateWordPriority, getWordAudio } from '@/api/word'
import { addFavoriteWord, removeFavoriteWord, checkFavoriteWord } from '@/api/favoriteWords'

const props = defineProps({
  chapter: {
    type: String,
    default: 'A'
  },
  chapterConfig: {
    type: Object,
    default: () => ({})
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  words: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['back', 'know', 'vague', 'unknown', 'complete'])

// 响应式数据
const currentWordIndex = ref(props.currentIndex)
const showMeaning = ref(false)
const isFavorite = ref(false)
const favoriteLoading = ref(false)

// 学习时长记录
const studyStartTime = ref(null)
const totalStudyTime = ref(0)

// 计算属性：当前显示的单词
const currentWord = computed(() => {
  if (!props.words || props.words.length === 0) {
    return '加载中...'
  }

  if (currentWordIndex.value >= props.words.length) {
    return '本组单词学习完成'
  }

  // 处理新的单词格式（对象）或旧格式（字符串）
  const wordItem = props.words[currentWordIndex.value]
  return typeof wordItem === 'string' ? wordItem : wordItem.word
})

// 计算属性：当前单词的释义（根据新格式获取中文释义）
const currentMeaning = computed(() => {
  if (!props.words || props.words.length === 0 || currentWordIndex.value >= props.words.length) {
    return ''
  }

  const wordItem = props.words[currentWordIndex.value]
  // 如果是新格式（对象），返回mean属性，否则返回空字符串
  return typeof wordItem === 'object' && wordItem.mean ? wordItem.mean : ''
})

// 计算属性：当前单词的音标
const currentPhonetic = computed(() => {
  if (!props.words || props.words.length === 0 || currentWordIndex.value >= props.words.length) {
    return ''
  }

  const wordItem = props.words[currentWordIndex.value]
  // 如果是新格式（对象），返回phonetic_symbol属性，否则返回空字符串
  return typeof wordItem === 'object' && wordItem.phonetic_symbol ? wordItem.phonetic_symbol : ''
})

// 计算进度百分比
const progressPercentage = computed(() => {
  if (!props.words || props.words.length === 0) return 0
  return Math.round(((currentWordIndex.value + 1) / props.words.length) * 100)
})

// 监听currentIndex变化
watch(() => props.currentIndex, (newIndex) => {
  currentWordIndex.value = newIndex
  showMeaning.value = false
})

// 监听currentWord以播放音频
watch(currentWord, async (newWord) => {
  if (newWord && newWord !== '加载中...' && newWord !== '本组单词学习完成') {
    // 记录学习开始时间
    if (!studyStartTime.value) {
      studyStartTime.value = new Date();
    }
    const result = await getWordAudio({ word: newWord });
    const audioUrl = result.data.data;
    console.log('audioUrl:' + audioUrl);

    // 检查音频URL是否有效
    if (!audioUrl || typeof audioUrl !== 'string') {
      console.error('无效的音频URL:', audioUrl);
      // 检查收藏状态
      checkFavoriteStatus();
      return;
    }

    const audio = new Audio();

      // 添加音频加载事件监听
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(err => {
          console.error('音频播放失败:', err);
        });
      }, { once: true });

      // 添加错误处理
      audio.addEventListener('error', (err) => {
        console.error('音频加载失败:', err);
        // 尝试使用备用音频源
        tryBackupAudioSource(newWord);
      }, { once: true });

      // 设置音频源
      audio.src = audioUrl;

      // 设置超时，如果音频加载时间过长则尝试备用源
      setTimeout(() => {
        if (audio.readyState < 2) { // HAVE_CURRENT_DATA
          console.warn('音频加载超时，尝试备用源');
          tryBackupAudioSource(newWord);
        }
      }, 5000); // 5秒超时
    
    // 检查收藏状态
    checkFavoriteStatus();
  } else if (newWord === '本组单词学习完成') {
    // 学习完成，计算总学习时长
    if (studyStartTime.value) {
      const endTime = new Date();
      const sessionDuration = (endTime.getTime() - studyStartTime.value.getTime()) / 1000 / 60; // 转换为分钟
      totalStudyTime.value += sessionDuration;
      console.log(`学习完成，本次学习时长: ${sessionDuration.toFixed(2)}分钟，总学习时长: ${totalStudyTime.value.toFixed(2)}分钟`);
    }
  }
})

// 尝试使用备用音频源
const tryBackupAudioSource = async (word) => {
  try {
    // 使用备用音频API（例如Google TTS）
    const backupAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`;
    const backupAudio = new Audio(backupAudioUrl);

    backupAudio.addEventListener('canplaythrough', () => {
      backupAudio.play().catch(err => {
        console.error('备用音频播放失败:', err);
      });
    }, { once: true });

    backupAudio.addEventListener('error', (err) => {
      console.error('备用音频加载失败:', err);
    }, { once: true });

    backupAudio.load();
  } catch (err) {
    console.error('备用音频源尝试失败:', err);
  }
}

// 检查单词是否已收藏
const checkFavoriteStatus = async () => {
  const wordItem = props.words[currentWordIndex.value];
  const wordId = wordItem?._id;
  if (!wordId) {
    console.log('没有可用的wordId');
    return;
  }
  
  try {
    const res = await checkFavoriteWord({ wordId });
    if (res.data.code === 200) {
      isFavorite.value = res.data.data.isFavorite;
      console.log('收藏状态:', res.data.data.isFavorite);
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
  }
}

// 切换收藏状态
const showNotification = (message, type) => {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // 设置样式
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.color = 'white';
  notification.style.fontSize = '14px';
  notification.style.zIndex = '9999';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.transition = 'all 0.3s ease';
  notification.style.opacity = '0';
  notification.style.transform = 'translateY(-20px)';
  
  // 根据类型设置背景色
  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
  } else if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
  }
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 显示动画
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // 3秒后自动消失
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    // 完全消失后从DOM中移除
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

const toggleFavorite = async () => {
  const wordItem = props.words[currentWordIndex.value];
  const wordId = wordItem?._id;
  if (!wordId || favoriteLoading.value) {
    console.log('没有可用的wordId或正在加载中');
    return;
  }
  
  favoriteLoading.value = true;
  try {
    if (isFavorite.value) {
      // 取消收藏
      const res = await removeFavoriteWord({ wordId });
      if (res.data.code === 200) {
        isFavorite.value = false;
        console.log('取消收藏成功');
        // 刷新个人主页的收藏列表
        if (window.refreshFavoriteWords) {
          window.refreshFavoriteWords();
        }
        // 显示成功提示
        showNotification('取消收藏成功', 'success');
      } else {
        showNotification(res.data.message || '取消收藏失败', 'error');
      }
    } else {
      // 添加收藏
      const res = await addFavoriteWord({ wordId });
      if (res.data.code === 200) {
        isFavorite.value = true;
        console.log('添加收藏成功');
        // 刷新个人主页的收藏列表
        if (window.refreshFavoriteWords) {
          window.refreshFavoriteWords();
        }
        // 显示成功提示
        showNotification('添加收藏成功', 'success');
      } else {
        showNotification(res.data.message || '添加收藏失败', 'error');
      }
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    showNotification(isFavorite.value ? '取消收藏失败' : '添加收藏失败', 'error');
  } finally {
    favoriteLoading.value = false;
  }
}

// 方法
const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value
}

const handleKnow = () => {
  // 获取当前单词（处理对象格式）
  const wordToQuery = typeof currentWord.value === 'string' ?
    currentWord.value :
    currentWord.value.word;

  // 直接标记为认识，不需要显示释义
  updateWordPriority({
    word: wordToQuery,
    newStatus: "know",
    source: "vocabulary" // 标记为词汇练习来源
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
    newStatus: "vague",
    source: "vocabulary" // 标记为词汇练习来源
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
    newStatus: "unknown",
    source: "vocabulary" // 标记为词汇练习来源
  })
  emit('unknown', currentWordIndex.value)
  nextWord()
}

// 切换到下一个单词
const nextWord = () => {
  if (currentWordIndex.value < props.words.length - 1) {
    currentWordIndex.value += 1
    showMeaning.value = false
  } else {
    // 当前批次单词学习完成
    emit('complete', {
      wordsCount: props.words.length,
      chapter: props.chapter,
      studyTime: Math.round(totalStudyTime.value * 100) / 100 // 保留两位小数
    })
  }
}

// 加载单词列表
const loadWords = async () => {
  try {
    const response = await getWordList({
      chapter: props.chapter
    })

    if (response.data.code === 200) {
      // 这里我们无法直接修改props.words，所以需要通过emit通知父组件
      // 但由于组件设计问题，这里暂时不处理
      console.log('加载单词列表成功:', response.data.data.words);
    } else {
      console.error('加载单词列表失败:', response.message)
    }
  } catch (error) {
    console.error('请求单词列表错误:', error)
  }
}

// 组件挂载时加载单词
// 如果传入了words属性，则使用传入的words，否则加载单词列表
if (!props.words || props.words.length === 0) {
  loadWords()
}
</script>

<style scoped>
.vocabulary-practice {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.practice-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.progress-info {
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-text {
  font-weight: 600;
  margin-right: 16px;
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

.favorite-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.favorite-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.favorite-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%);
  color: white;
}

.favorite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}

.word-actions {
  margin-bottom: 1.5rem;
}

.hint-btn {
  background: #e6f7ff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.hint-btn:hover {
  background: #bae7ff;
}

.hint-btn.active {
  background: #91d5ff;
}

.meaning-section {
  margin-top: 1.5rem;
  text-align: left;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 1rem;
}

.meaning-text {
  font-size: 1.1rem;
  line-height: 1.6;
}

.action-section {
  margin-top: 2rem;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 1rem;
}

.action-btn {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.know-btn {
  background: linear-gradient(135deg, #52c41a, #389e0d);
  color: white;
}

.know-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
}

.vague-btn {
  background: linear-gradient(135deg, #faad14, #f5222d);
  color: white;
}

.vague-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(250, 173, 20, 0.4);
}

.unknown-btn {
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  color: white;
}

.unknown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.btn-icon {
  font-size: 18px;
}

.quick-actions {
  text-align: center;
}

.quick-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
}
</style>
