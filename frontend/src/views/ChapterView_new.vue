<template>
  <main class="chapter-view">
    <div v-if="loading" class="loading-panel">
      <span></span>
      <strong>正在载入章节任务</strong>
      <p>同步角色、场景和训练目标。</p>
    </div>

    <div v-else-if="error" class="loading-panel error">
      <strong>章节加载失败</strong>
      <p>{{ error }}</p>
      <button class="primary-button" type="button" @click="fetchChapter">重新加载</button>
    </div>

    <div v-else-if="chapter" class="chapter-content">
      <section class="chapter-brief">
        <button class="back-btn" type="button" @click="goBack">返回剧情</button>
        <div class="brief-copy">
          <span class="chapter-kicker">{{ chapter.scene }}</span>
          <h1>{{ chapter.title }}</h1>
          <p>{{ chapter.storyBackground }}</p>
        </div>
        <aside class="brief-status" aria-label="章节进度">
          <span>Chapter Progress</span>
          <strong>{{ completedTasksCount }}/{{ totalTasksCount }}</strong>
          <div class="meter">
            <i :style="{ width: taskProgressPercent + '%' }"></i>
          </div>
        </aside>
      </section>

      <section class="role-strip" aria-label="角色信息">
        <article class="role-card user-role">
          <span>你的角色</span>
          <strong>{{ chapter.userRole }}</strong>
        </article>
        <article class="role-card ai-role">
          <span>AI 角色</span>
          <strong>{{ chapter.aiRole }}</strong>
        </article>
        <article class="role-card next-role">
          <span>下一步提示</span>
          <strong>{{ allTasksCompleted ? chapter.nextChapterHint : nextTaskLabel }}</strong>
        </article>
      </section>

      <section class="mission-board">
        <div class="section-heading">
          <div>
            <span class="chapter-kicker">Mission Tasks</span>
            <h2>任务列表</h2>
          </div>
          <p>点击未完成任务即可进入训练。已完成任务会保留在档案中，避免重复提交。</p>
        </div>

        <div class="task-list">
          <article
            v-for="(task, index) in chapter.tasks"
            :key="task.id"
            class="task-card"
            :class="{ completed: isTaskCompleted(task.id), active: selectedTask?.id === task.id }"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <span class="task-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
            </div>
            <h3>{{ task.name }}</h3>
            <p>{{ task.description }}</p>
            <div class="task-words">
              <span v-for="word in task.requiredWords" :key="word">{{ word }}</span>
            </div>
            <div class="task-footer">
              <strong>{{ isTaskCompleted(task.id) ? '已完成' : '待执行' }}</strong>
              <button type="button" :disabled="isTaskCompleted(task.id)">
                {{ isTaskCompleted(task.id) ? '锁定' : '开始' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="selectedTask" class="task-executor-container">
        <div class="executor-heading">
          <span class="chapter-kicker">Active Task</span>
          <h2>{{ selectedTask.name }}</h2>
        </div>
        <TaskExecutor
          :task="selectedTask"
          :story-id="storyId"
          :chapter-id="chapterId"
          :ai-role="chapter.aiRole"
          @complete="handleTaskComplete"
          @cancel="selectedTask = null"
        />
      </section>

      <section v-if="taskFeedback" class="task-feedback" :class="taskFeedback.isCompleted ? 'success' : 'error'">
        <div>
          <span class="chapter-kicker">{{ taskFeedback.isCompleted ? 'Accepted' : 'Review Needed' }}</span>
          <h3>{{ taskFeedback.isCompleted ? '任务完成' : '任务未通过' }}</h3>
          <p>{{ taskFeedback.feedback.message }}</p>
        </div>
        <div class="feedback-score">
          <span>得分</span>
          <strong>{{ taskFeedback.feedback.score }} / {{ taskFeedback.feedback.maxScore }}</strong>
        </div>
        <div v-if="taskFeedback.feedback.improvements && taskFeedback.feedback.improvements.length > 0" class="improvements">
          <h4>改进建议</h4>
          <ul>
            <li v-for="(improvement, index) in taskFeedback.feedback.improvements" :key="index">
              {{ improvement }}
            </li>
          </ul>
        </div>
        <button class="ghost-button" type="button" @click="taskFeedback = null">关闭反馈</button>
      </section>

      <section v-if="allTasksCompleted" class="next-hint">
        <span class="chapter-kicker">Chapter Clear</span>
        <p>{{ chapter.nextChapterHint }}</p>
      </section>
    </div>

    <div v-if="showChapterCompleteModal" class="chapter-complete-modal" :class="{ show: showModalAnimation }">
      <div class="modal-content" :class="{ show: showModalAnimation }">
        <div class="modal-emblem">CLEAR</div>
        <h3 class="modal-title">章节完成</h3>
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
          <button v-if="hasNextChapter" class="primary-button" type="button" @click="goToNextChapter">
            进入下一章
          </button>
          <button v-else class="primary-button" type="button" @click="goToStoryList">
            完成剧情
          </button>
          <button class="ghost-button" type="button" @click="closeModal">
            稍后再说
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import TaskExecutor from '@/components/tasks/TaskExecutor.vue';
import { useStoryProgress } from '@/composables/useStoryProgress';
import { toast } from '@/utils/toastService';

const route = useRoute();
const router = useRouter();
const {
  fetchStoryProgress,
  initChapter,
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

watch(() => route.params, (newParams) => {
  storyId.value = newParams.storyId as string;
  chapterId.value = parseInt(newParams.chapterId as string);
  selectedTask.value = null;
  taskFeedback.value = null;
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

const taskProgressPercent = computed(() => {
  if (!totalTasksCount.value) return 0;
  return Math.round((completedTasksCount.value / totalTasksCount.value) * 100);
});

const nextTaskLabel = computed(() => {
  const next = chapter.value?.tasks?.find((task: any) => !isTaskCompleted(task.id));
  return next ? `${getTaskTypeLabel(next.type)}：${next.name}` : '全部任务已完成';
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
  return chapterId.value < chapter.value.totalChapters;
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

    await initChapter(storyId.value, chapterId.value);
    await fetchStoryProgress(storyId.value);

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
    reading: '阅读',
    oral: '口语'
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

  const task = chapter.value.tasks.find((t: any) => t.id === selectedTask.value.id);
  if (task) {
    task.isCompleted = result.isCompleted;
  }

  try {
    await fetchStoryProgress(storyId.value);
  } catch (err: any) {
    console.error('刷新进度失败:', err);
  }

  taskFeedback.value = result;
  selectedTask.value = null;

  if (allTasksCompleted.value) {
    setTimeout(() => {
      showChapterComplete();
    }, 1000);
  }
}

function goBack() {
  router.push(`/story/${storyId.value}`);
}

function showChapterComplete() {
  showChapterCompleteModal.value = true;
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
  closeModal();

  setTimeout(() => {
    const nextChapterId = chapterId.value + 1;
    router.push(`/chapter/${storyId.value}/${nextChapterId}`).catch(err => {
      console.error('跳转失败:', err);
      toast.error('跳转到下一章失败，请稍后重试');
    });
  }, 350);
}

function goToStoryList() {
  closeModal();

  setTimeout(() => {
    router.push(`/story/${storyId.value}`).catch(err => {
      console.error('跳转失败:', err);
      toast.error('返回失败，请稍后重试');
    });
  }, 350);
}
</script>

<style scoped>
.chapter-view {
  min-height: calc(100vh - 68px);
  padding: clamp(16px, 4vw, 42px);
  background:
    linear-gradient(90deg, rgba(20, 31, 39, 0.055) 1px, transparent 1px),
    linear-gradient(rgba(20, 31, 39, 0.045) 1px, transparent 1px),
    radial-gradient(circle at 12% 16%, rgba(216, 157, 49, 0.22), transparent 30rem),
    radial-gradient(circle at 88% 10%, rgba(30, 91, 104, 0.14), transparent 34rem),
    #f5efe4;
  background-size: 42px 42px, 42px 42px, auto, auto, auto;
  color: #1d2b2e;
}

.chapter-content {
  display: grid;
  gap: 18px;
  width: min(1180px, 100%);
  margin: 0 auto;
}

.chapter-brief,
.role-card,
.mission-board,
.task-card,
.task-executor-container,
.task-feedback,
.next-hint,
.loading-panel,
.modal-content {
  border: 1px solid rgba(29, 43, 46, 0.13);
  background: rgba(255, 252, 243, 0.9);
  box-shadow: 0 22px 58px rgba(48, 46, 38, 0.1);
  backdrop-filter: blur(18px);
}

.chapter-brief {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 230px;
  gap: 22px;
  align-items: start;
  overflow: hidden;
  padding: clamp(22px, 4vw, 38px);
  border-radius: 8px;
}

.brief-copy h1,
.section-heading h2,
.executor-heading h2 {
  margin: 0;
  font-family: Georgia, "Times New Roman", "Noto Serif SC", serif;
}

.brief-copy h1 {
  max-width: 760px;
  margin-top: 14px;
  font-size: clamp(38px, 6vw, 72px);
  line-height: 0.98;
}

.brief-copy p,
.section-heading p,
.task-card p,
.task-feedback p,
.next-hint p,
.loading-panel p,
.modal-text {
  margin: 0;
  color: #617073;
  line-height: 1.72;
}

.brief-copy p {
  max-width: 780px;
  margin-top: 16px;
}

.chapter-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid rgba(175, 52, 44, 0.28);
  background: rgba(175, 52, 44, 0.08);
  color: #9b2d26;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 4px;
  padding: 0 16px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.back-btn,
.ghost-button {
  background: rgba(29, 43, 46, 0.08);
  color: #1d2b2e;
}

.primary-button {
  background: #1d2b2e;
  color: #fffaf0;
  box-shadow: 0 16px 28px rgba(29, 43, 46, 0.22);
}

.brief-status {
  display: grid;
  gap: 12px;
  padding: 18px;
  background: #1d2b2e;
  color: #fffaf0;
}

.brief-status span,
.role-card span,
.task-footer strong,
.feedback-score span,
.stat-label {
  color: rgba(29, 43, 46, 0.62);
  font-size: 13px;
  font-weight: 900;
}

.brief-status span {
  color: rgba(255, 250, 240, 0.68);
}

.brief-status strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 54px;
  line-height: 1;
}

.meter {
  height: 10px;
  overflow: hidden;
  background: rgba(255, 250, 240, 0.14);
}

.meter i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #d89d31, #fff0b8);
}

.role-strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  gap: 12px;
}

.role-card {
  display: grid;
  gap: 8px;
  min-height: 116px;
  padding: 18px;
  border-radius: 8px;
}

.role-card strong {
  font-size: 18px;
  line-height: 1.45;
}

.user-role {
  border-top: 5px solid #20483f;
}

.ai-role {
  border-top: 5px solid #9b2d26;
}

.next-role {
  border-top: 5px solid #d89d31;
}

.mission-board,
.task-executor-container,
.task-feedback,
.next-hint {
  display: grid;
  gap: 18px;
  padding: clamp(18px, 3vw, 26px);
  border-radius: 8px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
}

.section-heading h2,
.executor-heading h2 {
  margin-top: 8px;
  font-size: clamp(28px, 4vw, 42px);
}

.section-heading p {
  max-width: 420px;
  font-size: 14px;
}

.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 14px;
}

.task-card {
  position: relative;
  display: grid;
  gap: 14px;
  min-height: 300px;
  padding: 18px;
  border-radius: 8px;
  cursor: pointer;
}

.task-card:hover:not(.completed) {
  border-color: rgba(32, 72, 63, 0.32);
  box-shadow: 0 28px 66px rgba(48, 46, 38, 0.15);
}

.task-card.active {
  outline: 2px solid rgba(216, 157, 49, 0.48);
}

.task-card.completed {
  background:
    linear-gradient(135deg, rgba(32, 72, 63, 0.09), rgba(255, 252, 243, 0.9)),
    rgba(255, 252, 243, 0.9);
  cursor: not-allowed;
}

.task-header,
.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.task-index {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}

.task-type {
  padding: 5px 10px;
  background: rgba(29, 43, 46, 0.08);
  color: #1d2b2e;
  font-size: 12px;
  font-weight: 900;
}

.task-card h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
}

.task-words {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-self: end;
}

.task-words span {
  padding: 5px 9px;
  background: #fff3cf;
  color: #82580f;
  font-size: 12px;
  font-weight: 900;
}

.task-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(29, 43, 46, 0.1);
}

.task-footer button {
  min-height: 36px;
  background: #1d2b2e;
  color: #fffaf0;
}

.task-executor-container {
  background:
    linear-gradient(135deg, rgba(32, 72, 63, 0.08), rgba(255, 252, 243, 0.92)),
    rgba(255, 252, 243, 0.9);
}

.task-feedback {
  grid-template-columns: minmax(0, 1fr) 150px;
  align-items: start;
  animation: slideIn 0.26s ease-out;
}

.task-feedback h3 {
  margin: 8px 0 8px;
  font-size: 28px;
}

.task-feedback.success {
  border-top: 5px solid #20483f;
}

.task-feedback.error {
  border-top: 5px solid #9b2d26;
}

.feedback-score {
  display: grid;
  gap: 6px;
  padding: 16px;
  background: rgba(29, 43, 46, 0.06);
}

.feedback-score strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 28px;
}

.improvements {
  grid-column: 1 / -1;
  padding: 16px;
  background: rgba(29, 43, 46, 0.05);
}

.improvements h4 {
  margin: 0 0 8px;
}

.improvements ul {
  margin: 0;
  padding-left: 20px;
  color: #617073;
}

.task-feedback .ghost-button {
  justify-self: start;
}

.next-hint {
  border-left: 5px solid #d89d31;
}

.loading-panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  width: min(680px, 100%);
  min-height: 300px;
  margin: 0 auto;
  padding: 42px 20px;
  border-radius: 8px;
  text-align: center;
  align-content: center;
}

.loading-panel > span {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(29, 43, 46, 0.14);
  border-top-color: #9b2d26;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.loading-panel strong {
  font-size: 28px;
}

.loading-panel.error strong {
  color: #9b2d26;
}

.chapter-complete-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 21, 22, 0.48);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.chapter-complete-modal.show {
  opacity: 1;
}

.modal-content {
  display: grid;
  gap: 16px;
  width: min(500px, 100%);
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  transform: translateY(16px) scale(0.97);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-content.show {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.modal-emblem {
  display: grid;
  place-items: center;
  justify-self: center;
  width: 116px;
  height: 116px;
  border: 2px solid #20483f;
  color: #20483f;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
}

.modal-title {
  margin: 0;
  font-size: 32px;
}

.chapter-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: grid;
  gap: 8px;
  padding: 16px;
  background: rgba(29, 43, 46, 0.06);
}

.stat-value {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 30px;
  font-weight: 900;
}

.modal-actions {
  display: grid;
  gap: 10px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .chapter-brief,
  .role-strip,
  .task-feedback {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .brief-status {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .chapter-view {
    padding: 12px;
  }

  .brief-copy h1 {
    font-size: clamp(34px, 12vw, 52px);
  }

  .chapter-stats {
    grid-template-columns: 1fr;
  }
}
</style>
