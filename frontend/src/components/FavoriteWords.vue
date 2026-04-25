<template>
  <div class="favorite-words-container">
    <div class="favorite-words-header">
      <h2 class="favorite-words-title">
        <span class="title-icon">⭐</span>
        我的收藏单词
      </h2>
      <div class="stats-info">
        <span class="stat-item">共收藏 {{ favoriteWords.length }} 个单词</span>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="favoriteWords.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <p class="empty-text">还没有收藏任何单词</p>
      <p class="empty-hint">在单词学习页面点击收藏按钮来添加单词</p>
    </div>

    <div v-else class="words-grid">
      <div v-for="word in favoriteWords" :key="word.id" class="word-card">
        <div class="word-header">
          <h3 class="word-text">{{ word.word }}</h3>
          <button class="remove-btn" @click="handleRemoveFavorite(word.wordId)" title="取消收藏">
            ✕
          </button>
        </div>

        <div class="word-phonetic" v-if="word.phonetic">
          [{{ word.phonetic }}]
        </div>

        <div class="word-meaning">
          {{ word.meaning }}
        </div>

        <div class="word-example" v-if="word.example">
          <div class="example-label">例句：</div>
          <div class="example-text">{{ word.example }}</div>
        </div>

        <div class="word-footer">
          <span class="word-status" :class="'status-' + word.status">
            {{ getStatusText(word.status) }}
          </span>
          <span class="word-reviews">
            复习 {{ word.reviewCounts }} 次
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFavoriteWords, removeFavoriteWord } from '@/api/favoriteWords';
import { toast } from '@/utils/toastService';

// 收藏单词列表
const favoriteWords = ref([]);
const loading = ref(false);

// 获取收藏单词列表
const loadFavoriteWords = async () => {
  loading.value = true;
  try {
    const res = await getFavoriteWords();
    if (res.data.code === 200) {
      favoriteWords.value = res.data.data || [];
    } else {
      toast.error(res.data.message || '获取收藏单词失败');
    }
  } catch (error) {
    console.error('获取收藏单词失败:', error);
    toast.error('获取收藏单词失败');
  } finally {
    loading.value = false;
  }
};

// 取消收藏
const handleRemoveFavorite = async (wordId) => {
  // 直接执行取消收藏操作
  
  try {
    const res = await removeFavoriteWord({ wordId });
    if (res.data.code === 200) {
      toast.success('取消收藏成功');
      // 重新加载列表
      await loadFavoriteWords();
    } else {
      toast.error(res.data.message || '取消收藏失败');
    }
  } catch (error) {
    console.error('取消收藏失败:', error);
    toast.error('取消收藏失败');
  }
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'unknown': '未掌握',
    'vague': '模糊',
    'know': '已掌握'
  };
  return statusMap[status] || status;
};

// 组件挂载时加载数据
onMounted(() => {
  loadFavoriteWords();
});
</script>

<style scoped>
@import '../assets/css/favoriteWords.css';
</style>
