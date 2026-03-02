<template>
  <div class="vocabulary-card-overlay" @click="handleOverlayClick">
    <div class="vocabulary-card" @click.stop>
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在获取单词信息...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
      </div>

      <!-- 单词内容 -->
      <div v-else-if="wordData && wordData.word" class="word-content">
        <!-- 头部：单词和音标 -->
        <div class="word-header">
          <div class="word-main">
            <h1 class="word-title">{{ wordData.word }}</h1>
            <!-- 中文释义 -->
            <div v-if="chineseMeaning" class="chinese-meaning">
              {{ chineseMeaning }}
            </div>
            <div class="phonetics" v-if="wordData.phonetics && wordData.phonetics.length">
              <span v-for="(phonetic, index) in wordData.phonetics.slice(0, 2)" :key="index" class="phonetic">
                {{ phonetic.text }}
                <button v-if="phonetic.audio" @click="playAudio(phonetic.audio)" class="audio-btn" title="播放发音">
                  🔊
                </button>
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button 
              class="favorite-btn" 
              @click="toggleFavorite" 
              :class="{ active: isFavorite }"
              :disabled="favoriteLoading"
              :title="isFavorite ? '取消收藏' : '添加收藏'"
            >
              {{ favoriteLoading ? '...' : (isFavorite ? '⭐' : '☆') }}
            </button>
            <button class="close-btn" @click="$emit('next')" title="下一个单词">
              ✕
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-area">
          <!-- 词性和释义 -->
          <div class="meanings-section">
            <div v-for="(meaning, mIndex) in limitedMeanings" :key="mIndex" class="meaning-group">
              <!-- 词性标签 -->
              <div class="part-of-speech">
                {{ meaning.partOfSpeech }}
              </div>

              <!-- 释义列表 -->
              <div class="definitions-list">
                <div v-for="(definition, dIndex) in meaning.definitions.slice(0, 3)" :key="dIndex"
                  class="definition-item">
                  <div class="definition-main">
                    <span class="definition-number">{{ dIndex + 1 }}.</span>
                    <p class="definition-text">{{ truncateText(definition.definition, 100) }}</p>
                  </div>

                  <!-- 例句 -->
                  <div v-if="definition.example && definition.example.length < 80" class="example">
                    <span class="example-label">例:</span>
                    <span class="example-text">"{{ definition.example }}"</span>
                  </div>
                </div>

                <!-- 更多释义提示 -->
                <div v-if="meaning.definitions.length > 3" class="more-definitions">
                  还有 {{ meaning.definitions.length - 3 }} 个释义...
                </div>
              </div>
            </div>

            <!-- 更多词性提示 -->
            <div v-if="wordData.meanings && wordData.meanings.length > 2" class="more-meanings">
              还有 {{ wordData.meanings.length - 2 }} 个词性...
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data-state">
        <div class="waiting-icon">⏳</div>
        <p>请稍候...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { addFavoriteWord, removeFavoriteWord, checkFavoriteWord } from '@/api/favoriteWords';

const props = defineProps({
  word: {
    type: String,
    required: true
  },
  wordData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  // 添加中文释义属性
  chineseMeaning: {
    type: String,
    default: ''
  },
  // 添加wordId属性
  wordId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['next', 'audio-play', 'favorite-changed']);

// 收藏状态
const isFavorite = ref(false);
const favoriteLoading = ref(false);

// 限制显示的词性数量（最多2个）
const limitedMeanings = computed(() => {
  if (!props.wordData?.meanings) return [];
  return props.wordData.meanings.slice(0, 2);
});

// 文本截断函数
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 播放音频
const playAudio = (audioUrl) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('音频播放失败:', err);
    });
    emit('audio-play', audioUrl);
  }
};

// 点击遮罩层关闭
const handleOverlayClick = () => {
  emit('next');
};

// 检查单词是否已收藏
const checkFavoriteStatus = async () => {
  // 优先使用wordId，如果没有则使用wordData中的wordId
  const wordIdToCheck = props.wordId || (props.wordData && props.wordData.wordId);
  if (!wordIdToCheck) {
    console.log('没有可用的wordId');
    return;
  }
  
  try {
    const res = await checkFavoriteWord({ wordId: wordIdToCheck });
    if (res.data.code === 200) {
      isFavorite.value = res.data.data.isFavorite;
      console.log('收藏状态:', res.data.data.isFavorite);
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
  }
};

// 切换收藏状态
const toggleFavorite = async () => {
  // 优先使用wordId，如果没有则使用wordData中的wordId
  const wordIdToUse = props.wordId || (props.wordData && props.wordData.wordId);
  if (!wordIdToUse || favoriteLoading.value) {
    console.log('没有可用的wordId或正在加载中');
    return;
  }
  
  favoriteLoading.value = true;
  try {
    if (isFavorite.value) {
      // 取消收藏
      const res = await removeFavoriteWord({ wordId: wordIdToUse });
      if (res.data.code === 200) {
        isFavorite.value = false;
        emit('favorite-changed', { wordId: wordIdToUse, isFavorite: false });
      } else {
        alert(res.data.message || '取消收藏失败');
      }
    } else {
      // 添加收藏
      const res = await addFavoriteWord({ wordId: wordIdToUse });
      if (res.data.code === 200) {
        isFavorite.value = true;
        emit('favorite-changed', { wordId: wordIdToUse, isFavorite: true });
      } else {
        alert(res.data.message || '添加收藏失败');
      }
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    alert(isFavorite.value ? '取消收藏失败' : '添加收藏失败');
  } finally {
    favoriteLoading.value = false;
  }
};

// 组件挂载时检查收藏状态
onMounted(() => {
  checkFavoriteStatus();
});
</script>

<style scoped src="@/assets/css/vocabularyCard.css"></style>
