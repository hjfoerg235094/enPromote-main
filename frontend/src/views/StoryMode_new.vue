<template>
  <div class="story-mode">
    <!-- 剧情列表 -->
    <div v-if="!currentStory" class="story-list">
      <h2 class="title">剧情模式</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="stories">
        <div
          v-for="story in stories"
          :key="story.storyId"
          class="story-card"
          @click="selectStory(story.storyId)"
        >
          <h3>{{ story.title }}</h3>
          <p>{{ story.description }}</p>
          <div class="meta">
            <span>{{ story.totalChapters }} 章</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 剧情详情 -->
    <div v-else class="story-detail">
      <button class="back-btn" @click="backToList">← 返回列表</button>
      <h2 class="title">{{ currentStory.title }}</h2>
      <p class="description">{{ currentStory.description }}</p>

      <!-- 重置进度按钮 -->
      <button class="reset-btn" @click="showResetConfirm = true">重置进度</button>

      <!-- 章节列表 -->
      <div class="chapters">
        <div
          v-for="chapter in currentStory.chapters"
          :key="chapter.chapterId"
          class="chapter-card"
          :class="getChapterStatus(chapter.chapterId)"
          @click="startChapter(chapter.chapterId)"
        >
          <div class="chapter-header">
            <div class="chapter-status">
              <span v-if="isChapterCompleted(chapter.chapterId)" class="status-icon completed">✓</span>
              <span v-else-if="isChapterAccessible(chapter.chapterId)" class="status-icon accessible">🔓</span>
              <span v-else class="status-icon locked">🔒</span>
            </div>
            <h3>{{ chapter.title }}</h3>
          </div>
          <p>{{ chapter.scene }}</p>
          <div v-if="getChapterProgress(chapter.chapterId)" class="chapter-progress">
            <div class="progress-bar">
              <div class="progress" :style="{ width: getChapterProgress(chapter.chapterId) + '%' }"></div>
            </div>
            <span class="progress-text">{{ getChapterProgressText(chapter.chapterId) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <div v-if="showResetConfirm" class="reset-confirm-modal">
      <div class="modal-content">
        <h3>确认重置进度？</h3>
        <p>此操作将清除您在当前剧情中的所有进度，包括已完成的章节和任务。</p>
        <p class="warning">此操作不可恢复！</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showResetConfirm = false">取消</button>
          <button class="btn-confirm" @click="handleResetProgress" :disabled="resetting">
            {{ resetting ? '重置中...' : '确认重置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { resetStoryProgress } from '../api/storyProgress';

const router = useRouter();

const stories = ref<any[]>([]);
const currentStory = ref<any>(null);
const storyProgress = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showResetConfirm = ref(false);
const resetting = ref(false);

onMounted(() => {
  fetchStories();
});

async function fetchStories() {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get('/api/story/list');
    stories.value = response.data.data || [];
  } catch (err: any) {
    error.value = err.message || '获取剧情列表失败';
    console.error('获取剧情列表失败:', err);
  } finally {
    loading.value = false;
  }
}

async function selectStory(storyId: string) {
  loading.value = true;
  error.value = null;
  try {
    // 并行获取故事详情和进度
    const [storyResponse, progressResponse] = await Promise.all([
      axios.get(`/api/story/${storyId}`),
      axios.get(`/api/story/progress/${storyId}`)
    ]);

    currentStory.value = storyResponse.data.data;
    storyProgress.value = progressResponse.data.data;
  } catch (err: any) {
    error.value = err.message || '获取剧情详情失败';
    console.error('获取剧情详情失败:', err);
  } finally {
    loading.value = false;
  }
}

function isChapterAccessible(chapterId: number): boolean {
  if (!storyProgress.value) {
    // 没有进度记录,只能访问第一章
    return chapterId === 1;
  }

  // 可以访问当前章节或已完成的章节
  return chapterId <= storyProgress.value.currentChapterId;
}

function isChapterCompleted(chapterId: number): boolean {
  if (!storyProgress.value) return false;
  const chapter = storyProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId);
  return chapter?.isCompleted || false;
}

function getChapterStatus(chapterId: number): string {
  if (isChapterCompleted(chapterId)) return 'completed';
  if (isChapterAccessible(chapterId)) return 'accessible';
  return 'locked';
}

function getChapterProgress(chapterId: number): number {
  if (!storyProgress.value) return 0;
  const chapter = storyProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId);
  if (!chapter || !chapter.tasks || chapter.tasks.length === 0) return 0;
  const completedTasks = chapter.tasks.filter((t: any) => t.isCompleted).length;
  return Math.round((completedTasks / chapter.tasks.length) * 100);
}

function getChapterProgressText(chapterId: number): string {
  if (!storyProgress.value) return '0/0 任务完成';
  const chapter = storyProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId);
  if (!chapter || !chapter.tasks || chapter.tasks.length === 0) return '0/0 任务完成';
  const completedTasks = chapter.tasks.filter((t: any) => t.isCompleted).length;
  return `${completedTasks}/${chapter.tasks.length} 任务完成`;
}

function startChapter(chapterId: number) {
  if (!currentStory.value) return;

  if (!isChapterAccessible(chapterId)) {
    alert('请先完成前面的章节!');
    return;
  }

  router.push(`/chapter/${currentStory.value.storyId}/${chapterId}`);
}

function backToList() {
  currentStory.value = null;
  storyProgress.value = null;
}

async function handleResetProgress() {
  if (!currentStory.value) return;

  resetting.value = true;
  try {
    await resetStoryProgress(currentStory.value.storyId);
    // 重置成功后重新获取进度
    const progressResponse = await axios.get(`/story/progress/${currentStory.value.storyId}`);
    storyProgress.value = progressResponse.data.data;
    showResetConfirm.value = false;
    alert('进度已重置成功！');
  } catch (err: any) {
    console.error('重置进度失败:', err);
    alert('重置进度失败，请稍后重试');
  } finally {
    resetting.value = false;
  }
}
</script>

<style scoped>
.story-mode {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.description {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.story-list {
  animation: fadeIn 0.3s ease-in;
}

.stories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.story-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.story-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.story-card h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #333;
}

.story-card p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
}

.meta {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: #999;
}

.story-detail {
  animation: fadeIn 0.3s ease-in;
}

.back-btn {
  background: #f5f5f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
}

.reset-btn {
  background: #f56c6c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #f78989;
}

.reset-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
}

.modal-content p {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.6;
}

.modal-content .warning {
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  border: none;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #f56c6c;
  border: none;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #f78989;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chapters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.chapter-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.chapter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.chapter-card h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
}

.chapter-card p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* 章节状态样式 */
.chapter-card.completed {
  border-left: 4px solid #67c23a;
  background: linear-gradient(to right, #f0f9ff, white);
}

.chapter-card.accessible {
  border-left: 4px solid #409eff;
  background: white;
}

.chapter-card.locked {
  border-left: 4px solid #909399;
  background: #f5f7fa;
  cursor: not-allowed;
  opacity: 0.8;
}

.chapter-card.locked:hover {
  transform: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 章节头部 */
.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

/* 状态图标 */
.chapter-status {
  flex-shrink: 0;
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
}

.status-icon.completed {
  background: #67c23a;
  color: white;
}

.status-icon.accessible {
  background: #409eff;
  color: white;
}

.status-icon.locked {
  background: #909399;
  color: white;
}

/* 章节进度 */
.chapter-progress {
  margin-top: 12px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress {
  height: 100%;
  background: #409eff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.chapter-card.completed .progress {
  background: #67c23a;
}

.progress-text {
  font-size: 12px;
  color: #909399;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #f56c6c;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
