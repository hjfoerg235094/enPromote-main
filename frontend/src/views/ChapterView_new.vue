<template>
  <div class="chapter-view">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="chapter" class="chapter-content">
      <!-- 章节头部 -->
      <div class="chapter-header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <h1>{{ chapter.title }}</h1>
        <div class="scene-info">
          <span class="label">场景:</span>
          <span>{{ chapter.scene }}</span>
        </div>
      </div>

      <!-- 剧情背景 -->
      <div class="story-background">
        <h3>剧情背景</h3>
        <p>{{ chapter.storyBackground }}</p>
      </div>

      <!-- 角色信息 -->
      <div class="roles">
        <div class="role-card">
          <h4>你的角色</h4>
          <p>{{ chapter.userRole }}</p>
        </div>
        <div class="role-card">
          <h4>AI角色</h4>
          <p>{{ chapter.aiRole }}</p>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tasks">
        <h2>任务列表</h2>
        <div class="task-list">
          <div
            v-for="task in chapter.tasks"
            :key="task.id"
            class="task-card"
            :class="{ completed: isTaskCompleted(task.id) }"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
              <span v-if="isTaskCompleted(task.id)" class="completed-badge">✓</span>
            </div>
            <h3>{{ task.name }}</h3>
            <p>{{ task.description }}</p>
            <div class="task-words">
              <strong>目标单词:</strong>
              <span>{{ task.requiredWords.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务执行器 -->
      <div v-if="selectedTask" class="task-executor-container">
        <TaskExecutor
          :task="selectedTask"
          :story-id="storyId"
          :chapter-id="chapterId"
          :ai-role="chapter.aiRole"
          @complete="handleTaskComplete"
          @cancel="selectedTask = null"
        />
      </div>

      <!-- 任务反馈 -->
      <div v-if="taskFeedback" class="task-feedback" :class="taskFeedback.isCompleted ? 'success' : 'error'">
        <h3>{{ taskFeedback.isCompleted ? '任务完成！' : '任务未通过' }}</h3>
        <p>{{ taskFeedback.feedback.message }}</p>
        <div v-if="taskFeedback.feedback.improvements && taskFeedback.feedback.improvements.length > 0" class="improvements">
          <h4>改进建议:</h4>
          <ul>
            <li v-for="(improvement, index) in taskFeedback.feedback.improvements" :key="index">
              {{ improvement }}
            </li>
          </ul>
        </div>
        <div class="feedback-score">
          <span>得分: {{ taskFeedback.feedback.score }} / {{ taskFeedback.feedback.maxScore }}</span>
        </div>
        <button class="close-feedback-btn" @click="taskFeedback = null">关闭</button>
      </div>

      <!-- 下一章提示 -->
      <div v-if="allTasksCompleted" class="next-hint">
        <p>{{ chapter.nextChapterHint }}</p>
      </div>
    </div>

    <!-- 章节完成模态框 -->
    <div v-if="showChapterCompleteModal" class="chapter-complete-modal" :class="{ 'show': showModalAnimation }">
      <div class="modal-content" :class="{ 'show': showModalAnimation }">
        <div class="celebration-animation">
          <div class="confetti"></div>
          <div class="confetti"></div>
          <div class="confetti"></div>
          <div class="confetti"></div>
          <div class="confetti"></div>
          <div class="trophy-icon">🏆</div>
        </div>
        <h3 class="modal-title">章节完成！</h3>
        <p class="modal-text">{{ chapter.nextChapterHint }}</p>

        <div class="chapter-stats">
          <div class="stat-item">
            <span class="stat-label">完成任务</span>
            <span class="stat-value">{{ completedTasksCount }}/{{ totalTasksCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均得分</span>
            <span class="stat-value">{{ averageScore }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button v-if="hasNextChapter" @click="goToNextChapter" class="btn-primary">
            进入下一章 →
          </button>
          <button v-else @click="goToStoryList" class="btn-primary">
            完成剧情 🎉
          </button>
          <button @click="closeModal" class="btn-secondary">
            稍后再说
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import TaskExecutor from '@/components/tasks/TaskExecutor.vue';
import { useStoryProgress } from '@/composables/useStoryProgress';

const route = useRoute();
const router = useRouter();
const { 
  fetchStoryProgress, 
  initChapter, 
  updateProgress,
  currentProgress 
} = useStoryProgress();

const chapter = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedTask = ref<any>(null);
const taskFeedback = ref<any>(null);
const showChapterCompleteModal = ref(false);
const showModalAnimation = ref(false);

const storyId = ref<string>(route.params.storyId as string);
const chapterId = ref<number>(parseInt(route.params.chapterId as string));

console.log('ChapterView - storyId:', storyId.value);
console.log('ChapterView - chapterId:', chapterId.value);

// 监听路由参数变化
watch(() => route.params, (newParams) => {
  console.log('路由参数变化:', newParams);
  storyId.value = newParams.storyId as string;
  chapterId.value = parseInt(newParams.chapterId as string);
  console.log('更新后的章节ID:', chapterId.value);
  // 重新获取章节数据
  fetchChapter();
}, { immediate: false });

const allTasksCompleted = computed(() => {
  if (!chapter.value) return false;
  return chapter.value.tasks.every((task: any) => task.isCompleted);
});

const completedTasksCount = computed(() => {
  if (!chapter.value) return 0;
  return chapter.value.tasks.filter((task: any) => task.isCompleted).length;
});

const totalTasksCount = computed(() => {
  if (!chapter.value) return 0;
  return chapter.value.tasks.length;
});

const averageScore = computed(() => {
  if (!currentProgress.value) return 0;
  const chapterProgress = currentProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId.value);
  if (!chapterProgress || !chapterProgress.tasks || chapterProgress.tasks.length === 0) return 0;
  const totalScore = chapterProgress.tasks.reduce((sum: number, task: any) => sum + (task.score || 0), 0);
  return Math.round(totalScore / chapterProgress.tasks.length);
});

const hasNextChapter = computed(() => {
  if (!chapter.value) return false;
  // 增加默认章节数到10，避免第三章完成后直接显示剧情完成
  return chapterId.value < (chapter.value.totalChapters || 10);
});

onMounted(async () => {
  await fetchChapter();
});

async function fetchChapter() {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(`/api/story/${storyId.value}/chapter/${chapterId.value}`);
    chapter.value = response.data.data;

    // 初始化章节进度
    await initChapter(storyId.value, chapterId.value);

    // 获取章节进度
    await fetchStoryProgress(storyId.value);

    // 更新任务完成状态
    if (currentProgress.value) {
      const chapterProgress = currentProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId.value);
      if (chapterProgress?.tasks) {
        chapter.value.tasks.forEach((task: any) => {
          const taskProgress = chapterProgress.tasks.find((t: any) => t.taskId === task.id);
          if (taskProgress) {
            task.isCompleted = taskProgress.isCompleted;
          }
        });
      }
    }
  } catch (err: any) {
    error.value = err.message || '获取章节详情失败';
    console.error('获取章节详情失败:', err);
  } finally {
    loading.value = false;
  }
}

function getTaskTypeLabel(type: string) {
  const labels: Record<string, string> = {
    dialogue: '对话',
    spelling: '拼写',
    listening: '听力',
    reading: '阅读'
  };
  return labels[type] || type;
}

function isTaskCompleted(taskId: number): boolean {
  if (!currentProgress.value) return false;
  const chapter = currentProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId.value);
  if (!chapter) return false;
  const task = chapter.tasks?.find((t: any) => t.taskId === taskId);
  return task?.isCompleted || false;
}

function selectTask(task: any) {
  if (isTaskCompleted(task.id)) return;
  selectedTask.value = task;
  taskFeedback.value = null;
}

async function handleTaskComplete(result: any) {
  if (!selectedTask.value) return;
  
  // 更新任务状态
  const task = chapter.value.tasks.find((t: any) => t.id === selectedTask.value.id);
  if (task) {
    task.isCompleted = result.isCompleted;
  }
  
  // 刷新进度
  try {
    await fetchStoryProgress(storyId.value);
  } catch (err: any) {
    console.error('刷新进度失败:', err);
  }

  taskFeedback.value = result;
  
  // 关闭任务执行器
  selectedTask.value = null;

  // 检查是否所有任务都已完成
  if (allTasksCompleted.value) {
    // 延迟显示模态框，让用户先看到任务完成反馈
    setTimeout(() => {
      showChapterComplete();
    }, 1500);
  }
}

function goBack() {
  router.push(`/story/${storyId.value}`);
}

function showChapterComplete() {
  showChapterCompleteModal.value = true;
  // 延迟添加动画类，实现淡入效果
  setTimeout(() => {
    showModalAnimation.value = true;
  }, 50);
}

function closeModal() {
  showModalAnimation.value = false;
  setTimeout(() => {
    showChapterCompleteModal.value = false;
  }, 300);
}

function goToNextChapter() {
  // 先关闭模态框
  closeModal();

  // 延迟跳转，等待模态框关闭动画完成
  setTimeout(() => {
    const nextChapterId = chapterId.value + 1;
    console.log('跳转到下一章:', {
      storyId: storyId.value,
      currentChapterId: chapterId.value,
      nextChapterId: nextChapterId,
      totalChapters: chapter.value?.totalChapters
    });

    // 跳转到下一章
    router.push(`/chapter/${storyId.value}/${nextChapterId}`).catch(err => {
      console.error('跳转失败:', err);
      alert('跳转到下一章失败，请稍后重试');
    });
  }, 350);
}

function goToStoryList() {
  // 先关闭模态框
  closeModal();

  // 延迟跳转，等待模态框关闭动画完成
  setTimeout(() => {
    console.log('返回剧情列表:', {
      storyId: storyId.value
    });

    // 返回剧情列表
    router.push(`/story/${storyId.value}`).catch(err => {
      console.error('跳转失败:', err);
      alert('返回失败，请稍后重试');
    });
  }, 350);
}
</script>

<style scoped>
.chapter-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

.chapter-header {
  margin-bottom: 30px;
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

.chapter-header h1 {
  font-size: 32px;
  margin: 0 0 15px 0;
  color: #333;
}

.scene-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 16px;
}

.scene-info .label {
  font-weight: bold;
}

.story-background {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
}

.story-background h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.story-background p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.roles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.role-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.role-card h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.role-card p {
  margin: 0;
  color: #666;
}

.tasks h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.task-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.task-card:hover:not(.completed) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #409eff;
}

.task-card.completed {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-type {
  display: inline-block;
  padding: 4px 8px;
  background: #e8f4ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.completed-badge {
  color: #67c23a;
  font-size: 20px;
  font-weight: bold;
}

.task-card h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.task-card p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.task-words {
  font-size: 13px;
  color: #999;
}

.task-words strong {
  color: #666;
}

.next-hint {
  background: #f0f9ff;
  border-left: 4px solid #409eff;
  padding: 16px;
  border-radius: 4px;
}

.next-hint p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.task-executor-container {
  margin-bottom: 30px;
}

.task-feedback {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-in;
}

.task-feedback.success {
  border-left: 4px solid #67c23a;
}

.task-feedback.error {
  border-left: 4px solid #f56c6c;
}

.task-feedback h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 20px;
}

.task-feedback.success h3 {
  color: #67c23a;
}

.task-feedback.error h3 {
  color: #f56c6c;
}

.task-feedback p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.6;
}

.task-feedback .improvements {
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.task-feedback .improvements h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.task-feedback .improvements ul {
  margin: 0;
  padding-left: 20px;
}

.task-feedback .improvements li {
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.task-feedback .feedback-score {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.close-feedback-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.close-feedback-btn:hover {
  background: #66b1ff;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 章节完成模态框 */
.chapter-complete-modal {
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
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chapter-complete-modal.show {
  opacity: 1;
}

.chapter-complete-modal .modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: scale(0.9);
  opacity: 0;
  transition: all 0.3s ease;
  text-align: center;
}

.chapter-complete-modal .modal-content.show {
  transform: scale(1);
  opacity: 1;
}

/* 庆祝动画 */
.celebration-animation {
  position: relative;
  height: 120px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trophy-icon {
  font-size: 64px;
  animation: bounce 0.6s ease infinite alternate;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-10px);
  }
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall 3s linear infinite;
}

.confetti:nth-child(1) {
  background: #ff6b6b;
  left: 20%;
  animation-delay: 0s;
}

.confetti:nth-child(2) {
  background: #4ecdc4;
  left: 40%;
  animation-delay: 0.5s;
}

.confetti:nth-child(3) {
  background: #45b7d1;
  left: 60%;
  animation-delay: 1s;
}

.confetti:nth-child(4) {
  background: #96ceb4;
  left: 80%;
  animation-delay: 1.5s;
}

.confetti:nth-child(5) {
  background: #ffeaa7;
  left: 50%;
  animation-delay: 2s;
}

@keyframes confetti-fall {
  0% {
    top: -20px;
    transform: rotate(0deg);
    opacity: 1;
  }
  100% {
    top: 100px;
    transform: rotate(720deg);
    opacity: 0;
  }
}

/* 模态框标题和文本 */
.modal-title {
  font-size: 28px;
  font-weight: bold;
  color: #67c23a;
  margin: 0 0 16px 0;
  animation: slideIn 0.5s ease;
}

.modal-text {
  color: #666;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 24px 0;
  animation: slideIn 0.5s ease 0.1s both;
}

/* 章节统计 */
.chapter-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  animation: slideIn 0.5s ease 0.2s both;
}

.stat-item {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

/* 模态框按钮 */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn 0.5s ease 0.3s both;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: #f5f7fa;
  color: #666;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e4e7ed;
  color: #333;
}
</style>
