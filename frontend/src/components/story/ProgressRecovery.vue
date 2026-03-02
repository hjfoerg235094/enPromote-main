<template>
  <div class="progress-recovery" v-if="showRecovery">
    <div class="recovery-modal">
      <div class="modal-content">
        <h3>恢复学习进度</h3>
        <p>检测到您有未完成的学习进度，是否继续？</p>

        <div class="progress-info" v-if="savedProgress">
          <div class="info-item">
            <span class="label">剧情:</span>
            <span class="value">{{ savedProgress.title }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前章节:</span>
            <span class="value">第 {{ savedProgress.currentChapterId }} 章</span>
          </div>
          <div class="info-item">
            <span class="label">完成进度:</span>
            <span class="value">{{ savedProgress.completionPercentage }}%</span>
          </div>
          <div class="info-item">
            <span class="label">上次学习:</span>
            <span class="value">{{ formatDate(savedProgress.lastUpdated) }}</span>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: savedProgress?.completionPercentage + '%' }"></div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" @click="handleContinue">
            继续学习
          </button>
          <button class="btn btn-secondary" @click="handleNewStart">
            重新开始
          </button>
          <button class="btn btn-ghost" @click="handleCancel">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStoryProgress } from '../../composables/useStoryProgress';
import { useRouter } from 'vue-router';

const props = defineProps<{
  storyId: string;
}>();

const emit = defineEmits(['continue', 'new-start', 'cancel']);

const router = useRouter();
const { fetchStoryProgress, fetchAllProgresses, resetProgress } = useStoryProgress();

const showRecovery = ref(false);
const savedProgress = ref<any>(null);

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

// 检查是否有保存的进度
async function checkSavedProgress() {
  try {
    await fetchAllProgresses();
    const progress = await fetchStoryProgress(props.storyId);

    if (progress && !progress.isCompleted) {
      savedProgress.value = {
        title: progress.storyId,
        currentChapterId: progress.currentChapterId,
        completionPercentage: calculateCompletion(progress),
        lastUpdated: progress.lastUpdated
      };
      showRecovery.value = true;
    }
  } catch (error) {
    console.error('检查保存的进度失败:', error);
  }
}

// 计算完成百分比
function calculateCompletion(progress: any) {
  if (!progress.chapters || progress.chapters.length === 0) return 0;
  const completed = progress.chapters.filter((ch: any) => ch.isCompleted).length;
  return Math.round((completed / progress.chapters.length) * 100);
}

// 继续学习
async function handleContinue() {
  showRecovery.value = false;
  emit('continue', savedProgress.value);
}

// 重新开始
async function handleNewStart() {
  try {
    await resetProgress(props.storyId);
    showRecovery.value = false;
    emit('new-start');
  } catch (error) {
    console.error('重置进度失败:', error);
    alert('重置进度失败，请重试');
  }
}

// 取消
function handleCancel() {
  showRecovery.value = false;
  emit('cancel');
}

onMounted(() => {
  checkSavedProgress();
});
</script>

<style scoped>
.progress-recovery {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.recovery-modal {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
}

.modal-content > p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 16px;
}

.progress-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 24px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-ghost {
  background: transparent;
  color: #666;
}

.btn-ghost:hover {
  background: #f5f5f5;
}
</style>
