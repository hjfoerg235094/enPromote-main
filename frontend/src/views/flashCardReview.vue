<template>
  <div class="flashcard-review-page">
    <header class="page-header">
      <h1>闪卡复习</h1>
    </header>

    <main class="page-content">
      <FlashCardReview />
    </main>
  </div>
</template>

<script setup>
import FlashCardReview from '@/components/FlashCardReview.vue'
</script>

<style scoped>
.flashcard-review-page {
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
