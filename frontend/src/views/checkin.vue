<template>
  <div class="check-in-page">
    <header class="page-header">
      <button class="back-button" @click="goBack">
        <span class="icon">←</span>
        <span class="text">返回</span>
      </button>
      <h1 class="page-title">每日签到</h1>
      <div class="placeholder"></div>
    </header>

    <main class="page-content">
      <CheckIn />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import CheckIn from '@/components/CheckIn.vue';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.back();
};
</script>

<style scoped>
.check-in-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  font-size: 16px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.placeholder {
  width: 60px; /* 与返回按钮宽度相同，保持标题居中 */
}

.page-content {
  padding: 20px;
}
</style>
