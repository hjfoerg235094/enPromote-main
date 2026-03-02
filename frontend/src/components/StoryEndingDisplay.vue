
<template>
  <div class="ending-display" :class="endingClass">
    <div class="ending-container">
      <!-- 结局图标 -->
      <div class="ending-icon">{{ endingIcon }}</div>

      <!-- 结局标题 -->
      <h2 class="ending-title">{{ ending.title }}</h2>

      <!-- 结局描述 -->
      <p class="ending-description">{{ ending.description }}</p>

      <!-- 结局统计 -->
      <div class="ending-stats">
        <div class="stat-item">
          <span class="stat-label">总分</span>
          <span class="stat-value">{{ totalScore }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完成章节</span>
          <span class="stat-value">{{ completedChapters }}/{{ totalChapters }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">主导风格</span>
          <span class="stat-value">{{ dominantStyle }}</span>
        </div>
      </div>

      <!-- 关键选择回顾 -->
      <div v-if="keyChoices && keyChoices.length > 0" class="key-choices">
        <h3>关键选择回顾</h3>
        <div class="choices-list">
          <div
            v-for="(choice, index) in keyChoices"
            :key="index"
            class="choice-item"
          >
            <div class="choice-header">
              <span class="chapter-badge">第{{ choice.chapterId }}章</span>
              <span class="choice-text">{{ choice.choiceText }}</span>
            </div>
            <p class="choice-impact">{{ choice.impact }}</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn-primary" @click="restartStory">
          重新开始剧情
        </button>
        <button class="btn-secondary" @click="viewStoryTree">
          查看剧情树
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  ending: {
    endingId: string;
    title: string;
    description: string;
    isGoodEnding: boolean;
    isBadEnding: boolean;
    isSecretEnding: boolean;
  };
  totalScore: number;
  completedChapters: number;
  totalChapters: number;
  dominantStyle: string;
  keyChoices?: Array<{
    chapterId: number;
    choiceText: string;
    impact: string;
  }>;
}>();

const emit = defineEmits(['restart', 'viewTree']);

const endingClass = computed(() => {
  if (props.ending.isGoodEnding) return 'good-ending';
  if (props.ending.isBadEnding) return 'bad-ending';
  if (props.ending.isSecretEnding) return 'secret-ending';
  return 'normal-ending';
});

const endingIcon = computed(() => {
  if (props.ending.isGoodEnding) return '🏆';
  if (props.ending.isBadEnding) return '💔';
  if (props.ending.isSecretEnding) return '✨';
  return '📖';
});

function restartStory() {
  emit('restart');
}

function viewStoryTree() {
  emit('viewTree');
}
</script>

<style scoped>
.ending-display {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: all 0.5s ease;
}

.good-ending {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bad-ending {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

.secret-ending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.normal-ending {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.ending-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ending-icon {
  font-size: 80px;
  text-align: center;
  margin-bottom: 24px;
}

.ending-title {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  color: #333;
  margin: 0 0 16px 0;
}

.ending-description {
  font-size: 16px;
  line-height: 1.8;
  color: #666;
  text-align: center;
  margin: 0 0 32px 0;
}

.ending-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.key-choices {
  margin-bottom: 32px;
}

.key-choices h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 16px 0;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.choice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.chapter-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #409eff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.choice-text {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.choice-impact {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-buttons button {
  padding: 12px 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #409eff;
  border: none;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.btn-secondary {
  background: #f5f5f5;
  border: none;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
