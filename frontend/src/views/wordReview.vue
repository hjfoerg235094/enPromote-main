<template>
  <div class="word-review-page">
    <header class="page-header">
      <h1>单词复习</h1>
    </header>

    <main class="page-content">
      <WordReview />
    </main>
  </div>
</template>

<script setup>
import WordReview from '@/components/WordReview.vue'
</script>

<style scoped>
.word-review-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
