<template>
  <div class="story-progress-display">
    <div class="progress-header">
      <h3>{{ storyTitle }}</h3>
      <div class="progress-stats">
        <div class="stat-item">
          <span class="stat-label">当前章节</span>
          <span class="stat-value">第 {{ currentChapterId }} 章</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完成进度</span>
          <span class="stat-value">{{ completionPercentage }}%</span>
        </div>
        <div class="stat-item" v-if="totalScore !== undefined">
          <span class="stat-label">总分</span>
          <span class="stat-value">{{ totalScore }}</span>
        </div>
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: completionPercentage + '%' }"></div>
      </div>
      <span class="progress-text">{{ completedChapters }} / {{ totalChapters }} 章节完成</span>
    </div>

    <div class="chapter-progress" v-if="showChapterDetails && chapters.length > 0">
      <h4>章节详情</h4>
      <div class="chapter-list">
        <div
          v-for="chapter in chapters"
          :key="chapter.chapterId"
          class="chapter-item"
          :class="{
            'completed': chapter.isCompleted,
            'current': chapter.chapterId === currentChapterId,
            'locked': chapter.chapterId > currentChapterId
          }"
        >
          <div class="chapter-info">
            <span class="chapter-number">第 {{ chapter.chapterId }} 章</span>
            <span class="chapter-title">{{ getChapterTitle(chapter.chapterId) }}</span>
          </div>
          <div class="chapter-status">
            <span v-if="chapter.isCompleted" class="status-badge completed">已完成</span>
            <span v-else-if="chapter.chapterId === currentChapterId" class="status-badge current">进行中</span>
            <span v-else class="status-badge locked">未开始</span>
            <span class="chapter-score" v-if="chapter.score !== undefined">
              {{ chapter.score }}分
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="last-updated" v-if="lastUpdated">
      <span>上次更新: {{ formatDate(lastUpdated) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStoryProgress } from '../../composables/useStoryProgress';

const props = defineProps<{
  storyId: string;
  storyTitle: string;
  totalChapters: number;
  showChapterDetails?: boolean;
}>();

const { currentProgress } = useStoryProgress();

// 当前章节ID
const currentChapterId = computed(() => {
  return currentProgress.value?.currentChapterId || 1;
});

// 完成百分比
const completionPercentage = computed(() => {
  if (!currentProgress.value?.chapters) return 0;
  const completed = currentProgress.value.chapters.filter((ch: any) => ch.isCompleted).length;
  return Math.round((completed / props.totalChapters) * 100);
});

// 已完成章节数
const completedChapters = computed(() => {
  return currentProgress.value?.chapters?.filter((ch: any) => ch.isCompleted).length || 0;
});

// 章节列表
const chapters = computed(() => {
  return currentProgress.value?.chapters || [];
});

// 总分
const totalScore = computed(() => {
  return currentProgress.value?.totalScore;
});

// 最后更新时间
const lastUpdated = computed(() => {
  return currentProgress.value?.lastUpdated;
});

// 获取章节标题
function getChapterTitle(chapterId: number) {
  // 这里可以根据实际需求从配置中获取章节标题
  const titles: Record<number, string> = {
    1: '第一章',
    2: '第二章',
    3: '第三章',
    4: '第四章',
    5: '第五章'
  };
  return titles[chapterId] || `第 ${chapterId} 章`;
}

// 格式化日期
function formatDate(dateString: string) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.story-progress-display {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-header {
  margin-bottom: 20px;
}

.progress-header h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
}

.progress-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.progress-bar-container {
  margin-bottom: 24px;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.chapter-progress {
  margin-top: 24px;
}

.chapter-progress h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f5f5f5;
  transition: all 0.2s;
}

.chapter-item.completed {
  background: #e8f5e9;
}

.chapter-item.current {
  background: #e3f2fd;
  border: 2px solid #2196F3;
}

.chapter-item.locked {
  opacity: 0.6;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chapter-number {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.chapter-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.chapter-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #4CAF50;
  color: white;
}

.status-badge.current {
  background: #2196F3;
  color: white;
}

.status-badge.locked {
  background: #9e9e9e;
  color: white;
}

.chapter-score {
  font-size: 14px;
  font-weight: 600;
  color: #4CAF50;
}

.last-updated {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #999;
  text-align: right;
}
</style>
