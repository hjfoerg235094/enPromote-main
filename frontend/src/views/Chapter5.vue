<template>
  <div class="chapter-5">
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
        </div>
        <h2>章节完成！</h2>
        <p>恭喜你完成了第五章：撤离</p>
        <div class="completion-stats">
          <div class="stat-item">
            <span class="label">完成时间:</span>
            <span class="value">{{ completionTime }}</span>
          </div>
          <div class="stat-item">
            <span class="label">总得分:</span>
            <span class="value">{{ totalScore }}</span>
          </div>
        </div>
        <button class="next-chapter-btn" @click="goToNextChapter">下一章</button>
        <button class="back-btn" @click="showChapterCompleteModal = false">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { chapter5Data } from '../data/chapter5';
import TaskExecutor from '../components/tasks/TaskExecutor.vue';

const router = useRouter();
const storyId = 'story1';
const chapterId = 5;

const chapter = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedTask = ref<any>(null);
const taskFeedback = ref<any>(null);
const showChapterCompleteModal = ref(false);
const showModalAnimation = ref(false);
const startTime = ref<Date | null>(null);
const completionTime = ref<string>('');
const totalScore = ref<number>(0);

onMounted(() => {
  loadChapter();
});

function loadChapter() {
  loading.value = true;
  error.value = null;

  try {
    // 模拟加载章节数据
    setTimeout(() => {
      chapter.value = chapter5Data;
      loading.value = false;
      startTime.value = new Date();
    }, 500);
  } catch (err: any) {
    error.value = err.message || '加载章节失败';
    loading.value = false;
  }
}

function isTaskCompleted(taskId: number): boolean {
  // 这里可以从后端获取任务完成状态
  return false;
}

function getTaskTypeLabel(type: string): string {
  const typeLabels: { [key: string]: string } = {
    'dialogue': '对话',
    'spelling': '拼写',
    'listening': '听力',
    'reading': '阅读'
  };
  return typeLabels[type] || type;
}

function selectTask(task: any) {
  selectedTask.value = task;
}

function handleTaskComplete(result: any) {
  taskFeedback.value = result;
  selectedTask.value = null;

  // 更新总得分
  if (result.feedback && result.feedback.score) {
    totalScore.value += result.feedback.score;
  }

  // 检查是否所有任务都已完成
  if (chapter.value && chapter.value.tasks.every((t: any) => isTaskCompleted(t.id))) {
    showChapterComplete();
  }
}

function showChapterComplete() {
  if (startTime.value) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.value.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    completionTime.value = `${minutes}分${seconds}秒`;
  }

  setTimeout(() => {
    showChapterCompleteModal.value = true;
    setTimeout(() => {
      showModalAnimation.value = true;
    }, 100);
  }, 300);
}

function goBack() {
  router.push('/story');
}

function goToNextChapter() {
  // 这里可以导航到下一章
  alert('第五章是最后一章，感谢您的游玩！');
  showChapterCompleteModal.value = false;
}

const allTasksCompleted = computed(() => {
  if (!chapter.value) return false;
  return chapter.value.tasks.every((t: any) => isTaskCompleted(t.id));
});
</script>

<style scoped>
.chapter-5 {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e8e8e8;
}

.back-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e8e8e8;
}

.chapter-header h1 {
  flex: 1;
  margin: 0;
  font-size: 28px;
  color: #333;
}

.scene-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f7ff;
  border-radius: 20px;
}

.scene-info .label {
  font-weight: 600;
  color: #1890ff;
}

.scene-info span:last-child {
  color: #666;
}

.story-background {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
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
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.role-card {
  flex: 1;
  padding: 20px;
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  text-align: center;
}

.role-card h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.role-card p {
  margin: 0;
  color: #666;
  font-size: 18px;
}

.tasks h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.task-card {
  padding: 20px;
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.task-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.task-card.completed {
  border-color: #52c41a;
  background: #f6ffed;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-type {
  padding: 4px 12px;
  background: #1890ff;
  color: white;
  border-radius: 12px;
  font-size: 12px;
}

.completed-badge {
  color: #52c41a;
  font-size: 20px;
}

.task-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.task-card p {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.5;
}

.task-words {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.task-words strong {
  color: #333;
  margin-right: 8px;
}

.task-words span {
  color: #666;
}

.task-executor-container {
  margin-bottom: 30px;
}

.task-feedback {
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.task-feedback.success {
  background: #f6ffed;
  border: 2px solid #52c41a;
}

.task-feedback.error {
  background: #fff2f0;
  border: 2px solid #ff4d4f;
}

.task-feedback h3 {
  margin: 0 0 10px 0;
}

.task-feedback.success h3 {
  color: #52c41a;
}

.task-feedback.error h3 {
  color: #ff4d4f;
}

.task-feedback p {
  margin: 0 0 15px 0;
  color: #666;
}

.improvements {
  margin-bottom: 15px;
}

.improvements h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.improvements ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.improvements li {
  margin-bottom: 5px;
}

.feedback-score {
  padding: 10px;
  background: white;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.close-feedback-btn {
  width: 100%;
  padding: 10px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-feedback-btn:hover {
  background: #40a9ff;
}

.next-hint {
  padding: 20px;
  background: #fff7e6;
  border: 2px solid #fa8c16;
  border-radius: 8px;
  text-align: center;
}

.next-hint p {
  margin: 0;
  color: #d46b08;
  font-size: 16px;
  font-weight: 500;
}

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
  opacity: 0;
  transition: opacity 0.3s;
}

.chapter-complete-modal.show {
  opacity: 1;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  transform: scale(0.8);
  transition: transform 0.3s;
}

.modal-content.show {
  transform: scale(1);
}

.celebration-animation {
  margin-bottom: 20px;
}

.confetti {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PC9zdmc+');
  background-size: contain;
  background-repeat: no-repeat;
}

.completion-stats {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item .label {
  color: #666;
  font-size: 14px;
}

.stat-item .value {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.next-chapter-btn {
  padding: 12px 32px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
  margin-right: 10px;
}

.next-chapter-btn:hover {
  background: #73d13d;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #ff4d4f;
}
</style>
