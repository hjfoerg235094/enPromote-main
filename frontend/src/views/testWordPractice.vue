<template>
  <div class="test-container">
    <h1>单词练习测试页面</h1>
    <VocabularyPracticeNew 
      :chapter="'A'"
      :chapterConfig="{ id: 'A', name: '酒店场景' }"
      :currentIndex="0"
    />
  </div>
</template>

<script setup>
import VocabularyPracticeNew from '@/components/VocabularyPracticeNew.vue'
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  text-align: center;
}
</style>
