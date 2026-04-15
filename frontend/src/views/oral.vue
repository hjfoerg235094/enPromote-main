
<template>
  <div class="oral-page">
    <div class="page-header">
      <h1>英语口语评测</h1>
      <p>通过专业的AI评测，提升你的英语发音水平</p>
    </div>

    <OralEvaluation />
  </div>
</template>

<script setup lang="ts">
import OralEvaluation from '../components/OralEvaluation_new.vue';
</script>

<style scoped>
.oral-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.page-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.page-header p {
  font-size: 1.1em;
  opacity: 0.9;
}
</style>
