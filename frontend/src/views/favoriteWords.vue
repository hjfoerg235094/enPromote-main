<template>
  <div class="favorite-words-page">
    <div class="page-header">
      <h1 class="page-title">收藏单词</h1>
      <p class="page-subtitle">查看和管理你收藏的单词</p>
    </div>

    <FavoriteWords />
  </div>
</template>

<script setup>
import FavoriteWords from '@/components/FavoriteWords.vue';
</script>

<style scoped>
.favorite-words-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 32px 20px;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 32px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

@media (max-width: 768px) {
  .favorite-words-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }
}
</style>
