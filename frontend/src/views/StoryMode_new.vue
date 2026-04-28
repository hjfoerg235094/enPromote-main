<template>
  <main class="story-mode-page">
    <section v-if="!currentStory" class="story-shell">
      <header class="story-hero">
        <div class="hero-copy">
          <span class="story-kicker">Role Story</span>
          <h1>进入一份可推进的英语任务档案。</h1>
          <p>选择角色剧情，按章节完成对话、听力、拼写与阅读任务。每个章节都是一段真实语境，进度会随着任务完成逐步解锁。</p>
          <div class="hero-actions">
            <button class="primary-button" type="button" @click="fetchStories">刷新剧情</button>
            <span>{{ stories.length }} 个故事档案待命</span>
          </div>
        </div>
        <aside class="dossier-card" aria-label="剧情模块概览">
          <span>Mission Board</span>
          <strong>{{ stories.length }}</strong>
          <p>角色剧情</p>
          <div class="dossier-lines">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </aside>
      </header>

      <div v-if="loading" class="state-panel">
        <span class="state-mark"></span>
        <strong>正在同步剧情档案</strong>
        <p>稍等一下，故事列表马上出现。</p>
      </div>
      <div v-else-if="error" class="state-panel error">
        <span class="state-mark"></span>
        <strong>剧情加载失败</strong>
        <p>{{ error }}</p>
        <button class="primary-button" type="button" @click="fetchStories">重新加载</button>
      </div>

      <section v-else class="story-grid" aria-label="剧情列表">
        <article
          v-for="(story, index) in stories"
          :key="story.storyId"
          class="story-card"
          :style="{ '--accent-step': index }"
          @click="selectStory(story.storyId, true)"
        >
          <div class="story-card-top">
            <span>档案 {{ String(index + 1).padStart(2, '0') }}</span>
            <em>{{ story.totalChapters }} 章</em>
          </div>
          <div>
            <h2>{{ story.title }}</h2>
            <p>{{ story.description }}</p>
          </div>
          <button class="text-button" type="button">打开剧情</button>
        </article>
      </section>
    </section>

    <section v-else class="story-shell story-detail">
      <header class="detail-hero">
        <button class="ghost-button" type="button" @click="backToList">返回剧情库</button>
        <div class="detail-copy">
          <span class="story-kicker">Current Operation</span>
          <h1>{{ currentStory.title }}</h1>
          <p>{{ currentStory.description }}</p>
        </div>
        <div class="progress-summary">
          <span>章节进度</span>
          <strong>{{ completedChapterCount }}/{{ currentStory.chapters?.length || 0 }}</strong>
          <button class="danger-button" type="button" @click="showResetConfirm = true">重置进度</button>
        </div>
      </header>

      <section class="chapter-slider" aria-label="章节滑块">
        <div class="slider-toolbar">
          <div>
            <span class="story-kicker">Chapter Reel</span>
            <h2>一章一章推进剧情</h2>
          </div>
          <div class="slider-controls">
            <button class="ghost-button" type="button" :disabled="activeChapterIndex === 0" @click="prevChapterCard">
              上一章
            </button>
            <span>{{ activeChapterIndex + 1 }} / {{ currentStory.chapters?.length || 0 }}</span>
            <button
              class="ghost-button"
              type="button"
              :disabled="activeChapterIndex >= (currentStory.chapters?.length || 1) - 1"
              @click="nextChapterCard"
            >
              下一章
            </button>
          </div>
        </div>

        <div class="slider-window">
          <div class="chapter-track" :style="{ transform: `translateX(-${activeChapterIndex * 100}%)` }">
            <article
              v-for="chapter in currentStory.chapters"
              :key="chapter.chapterId"
              class="chapter-slide"
              :class="getChapterStatus(chapter.chapterId)"
            >
              <div class="chapter-index">
                <span>{{ chapter.chapterId }}</span>
              </div>
              <div class="chapter-body">
                <div class="chapter-heading">
                  <span>{{ chapterStatusLabel(chapter.chapterId) }}</span>
                  <h2>{{ chapter.title }}</h2>
                </div>
                <p>{{ chapter.scene }}</p>
                <div class="chapter-progress">
                  <div class="progress-bar">
                    <i :style="{ width: getChapterProgress(chapter.chapterId) + '%' }"></i>
                  </div>
                  <span>{{ getChapterProgressText(chapter.chapterId) }}</span>
                </div>
                <div class="chapter-meta">
                  <div>
                    <span>状态</span>
                    <strong>{{ chapterStatusLabel(chapter.chapterId) }}</strong>
                  </div>
                  <div>
                    <span>训练进度</span>
                    <strong>{{ getChapterProgress(chapter.chapterId) }}%</strong>
                  </div>
                </div>
                <button
                  class="chapter-action"
                  type="button"
                  :disabled="!isChapterAccessible(chapter.chapterId)"
                  @click="startChapter(chapter.chapterId)"
                >
                  {{ isChapterCompleted(chapter.chapterId) ? '进入复盘' : '进入本章' }}
                </button>
              </div>
            </article>
          </div>
        </div>

        <div class="chapter-dots" aria-label="章节快速切换">
          <button
            v-for="(chapter, index) in currentStory.chapters"
            :key="chapter.chapterId"
            type="button"
            :class="{ active: activeChapterIndex === index, locked: !isChapterAccessible(chapter.chapterId) }"
            @click="activeChapterIndex = index"
          >
            {{ chapter.chapterId }}
          </button>
        </div>
      </section>
    </section>

    <div v-if="showResetConfirm" class="modal-backdrop" @click="showResetConfirm = false">
      <section class="reset-modal" @click.stop>
        <span class="story-kicker">Reset Progress</span>
        <h2>确认重置剧情进度？</h2>
        <p>这会清除当前剧情中已完成的章节和任务记录。重置后可以从第一章重新开始。</p>
        <div class="modal-actions">
          <button class="ghost-button" type="button" @click="showResetConfirm = false">取消</button>
          <button class="danger-button solid" type="button" :disabled="resetting" @click="handleResetProgress">
            {{ resetting ? '重置中' : '确认重置' }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { resetStoryProgress } from '../api/storyProgress';
import { toast } from '@/utils/toastService';

const route = useRoute();
const router = useRouter();

const stories = ref<any[]>([]);
const currentStory = ref<any>(null);
const storyProgress = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showResetConfirm = ref(false);
const resetting = ref(false);
const activeChapterIndex = ref(0);

const completedChapterCount = computed(() => {
  if (!currentStory.value?.chapters) return 0;
  return currentStory.value.chapters.filter((chapter: any) => isChapterCompleted(chapter.chapterId)).length;
});

onMounted(async () => {
  await fetchStories();
  const storyId = route.params.storyId as string | undefined;
  if (storyId) await selectStory(storyId, false);
});

watch(
  () => route.params.storyId,
  async (storyId) => {
    if (storyId && storyId !== currentStory.value?.storyId) {
      await selectStory(storyId as string, false);
    }
    if (!storyId && currentStory.value) {
      currentStory.value = null;
      storyProgress.value = null;
    }
  }
);

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

async function selectStory(storyId: string, updateRoute = true) {
  loading.value = true;
  error.value = null;
  try {
    const [storyResponse, progressResponse] = await Promise.all([
      axios.get(`/api/story/${storyId}`),
      axios.get(`/api/story/progress/${storyId}`)
    ]);

    currentStory.value = storyResponse.data.data;
    storyProgress.value = progressResponse.data.data;
    activeChapterIndex.value = getInitialChapterIndex();
    if (updateRoute) router.push(`/story/${storyId}`);
  } catch (err: any) {
    error.value = err.message || '获取剧情详情失败';
    console.error('获取剧情详情失败:', err);
  } finally {
    loading.value = false;
  }
}

function isChapterAccessible(chapterId: number): boolean {
  if (!storyProgress.value) return chapterId === 1;
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

function chapterStatusLabel(chapterId: number): string {
  if (isChapterCompleted(chapterId)) return '已完成';
  if (isChapterAccessible(chapterId)) return chapterId === storyProgress.value?.currentChapterId ? '进行中' : '可进入';
  return '未解锁';
}

function getChapterProgress(chapterId: number): number {
  if (!storyProgress.value) return 0;
  const chapter = storyProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId);
  if (!chapter || !chapter.tasks || chapter.tasks.length === 0) return 0;
  const completedTasks = chapter.tasks.filter((task: any) => task.isCompleted).length;
  return Math.round((completedTasks / chapter.tasks.length) * 100);
}

function getChapterProgressText(chapterId: number): string {
  if (!storyProgress.value) return '0/0 任务完成';
  const chapter = storyProgress.value.chapters?.find((ch: any) => ch.chapterId === chapterId);
  if (!chapter || !chapter.tasks || chapter.tasks.length === 0) return '0/0 任务完成';
  const completedTasks = chapter.tasks.filter((task: any) => task.isCompleted).length;
  return `${completedTasks}/${chapter.tasks.length} 任务完成`;
}

function startChapter(chapterId: number) {
  if (!currentStory.value) return;

  if (!isChapterAccessible(chapterId)) {
    toast.warning('请先完成前面的章节');
    return;
  }

  router.push(`/chapter/${currentStory.value.storyId}/${chapterId}`);
}

function backToList() {
  currentStory.value = null;
  storyProgress.value = null;
  activeChapterIndex.value = 0;
  router.push('/story');
}

function getInitialChapterIndex() {
  const chapters = storyResponseSafeChapters();
  if (!chapters.length) return 0;
  const currentChapterId = storyProgress.value?.currentChapterId || 1;
  const index = chapters.findIndex((chapter: any) => chapter.chapterId === currentChapterId);
  return index >= 0 ? index : 0;
}

function storyResponseSafeChapters() {
  return currentStory.value?.chapters || [];
}

function prevChapterCard() {
  activeChapterIndex.value = Math.max(0, activeChapterIndex.value - 1);
}

function nextChapterCard() {
  const maxIndex = Math.max(0, (currentStory.value?.chapters?.length || 1) - 1);
  activeChapterIndex.value = Math.min(maxIndex, activeChapterIndex.value + 1);
}

async function handleResetProgress() {
  if (!currentStory.value) return;

  resetting.value = true;
  try {
    await resetStoryProgress(currentStory.value.storyId);
    const progressResponse = await axios.get(`/api/story/progress/${currentStory.value.storyId}`);
    storyProgress.value = progressResponse.data.data;
    showResetConfirm.value = false;
    toast.success('进度已重置');
  } catch (err: any) {
    console.error('重置进度失败:', err);
    toast.error('重置进度失败，请稍后重试');
  } finally {
    resetting.value = false;
  }
}
</script>

<style scoped>
.story-mode-page {
  min-height: calc(100vh - 68px);
  padding: clamp(18px, 4vw, 46px);
  background:
    linear-gradient(90deg, rgba(20, 31, 39, 0.06) 1px, transparent 1px),
    linear-gradient(rgba(20, 31, 39, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 12% 10%, rgba(255, 188, 79, 0.24), transparent 30rem),
    radial-gradient(circle at 88% 18%, rgba(24, 112, 130, 0.16), transparent 34rem),
    #f4efe2;
  background-size: 44px 44px, 44px 44px, auto, auto, auto;
  color: #1d2b2e;
}

.story-shell {
  display: grid;
  gap: 22px;
  width: min(1180px, 100%);
  margin: 0 auto;
}

.story-hero,
.detail-hero,
.story-card,
.chapter-slide,
.chapter-slider,
.state-panel,
.reset-modal {
  border: 1px solid rgba(29, 43, 46, 0.13);
  background: rgba(255, 252, 243, 0.88);
  box-shadow: 0 22px 60px rgba(48, 46, 38, 0.1);
  backdrop-filter: blur(18px);
}

.story-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 28px;
  overflow: hidden;
  min-height: 360px;
  padding: clamp(26px, 5vw, 54px);
  border-radius: 8px;
}

.story-hero::after {
  content: "";
  position: absolute;
  inset: auto -80px -120px auto;
  width: 420px;
  height: 260px;
  border: 1px solid rgba(29, 43, 46, 0.13);
  transform: rotate(-11deg);
  background: repeating-linear-gradient(90deg, rgba(29, 43, 46, 0.08) 0 1px, transparent 1px 18px);
}

.hero-copy,
.detail-copy,
.dossier-card,
.progress-summary {
  position: relative;
  z-index: 1;
}

.story-kicker {
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

h1,
h2,
p {
  margin: 0;
}

.story-hero h1,
.detail-hero h1 {
  max-width: 760px;
  margin-top: 18px;
  font-family: Georgia, "Times New Roman", "Noto Serif SC", serif;
  font-size: clamp(42px, 7vw, 82px);
  line-height: 0.98;
  font-weight: 800;
}

.story-hero p,
.detail-hero p,
.story-card p,
.chapter-slide p,
.state-panel p,
.reset-modal p {
  color: #617073;
  line-height: 1.75;
}

.story-hero p,
.detail-hero p {
  max-width: 680px;
  margin-top: 16px;
  font-size: 16px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 28px;
}

.hero-actions span {
  color: #617073;
  font-size: 13px;
  font-weight: 800;
}

.dossier-card {
  align-self: end;
  display: grid;
  gap: 8px;
  min-height: 250px;
  padding: 24px;
  border-radius: 6px;
  background:
    linear-gradient(145deg, rgba(29, 43, 46, 0.92), rgba(38, 54, 56, 0.86)),
    #1d2b2e;
  color: #fffaf0;
}

.dossier-card span,
.dossier-card p {
  color: rgba(255, 250, 240, 0.72);
  font-weight: 900;
}

.dossier-card strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 86px;
  line-height: 0.9;
}

.dossier-lines {
  display: grid;
  gap: 9px;
  margin-top: auto;
}

.dossier-lines i {
  display: block;
  height: 8px;
  background: rgba(255, 250, 240, 0.16);
}

.dossier-lines i:nth-child(2) {
  width: 72%;
}

.dossier-lines i:nth-child(3) {
  width: 46%;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 4px;
  padding: 0 16px;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.primary-button {
  background: #1d2b2e;
  color: #fffaf0;
  box-shadow: 0 16px 28px rgba(29, 43, 46, 0.22);
}

.ghost-button {
  background: rgba(29, 43, 46, 0.08);
  color: #1d2b2e;
}

.danger-button {
  background: rgba(175, 52, 44, 0.11);
  color: #9b2d26;
}

.danger-button.solid {
  background: #9b2d26;
  color: #fffaf0;
}

.text-button {
  justify-self: start;
  min-height: auto;
  padding: 0;
  background: transparent;
  color: #9b2d26;
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}

.story-card {
  position: relative;
  display: grid;
  align-content: space-between;
  gap: 34px;
  min-height: 300px;
  overflow: hidden;
  padding: 24px;
  border-radius: 8px;
  cursor: pointer;
}

.story-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-top: 5px solid hsl(calc(12 + var(--accent-step) * 52), 55%, 42%);
}

.story-card:hover {
  border-color: rgba(155, 45, 38, 0.35);
  box-shadow: 0 28px 70px rgba(48, 46, 38, 0.16);
}

.story-card-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #617073;
  font-size: 13px;
  font-weight: 900;
}

.story-card-top em {
  color: #1d2b2e;
  font-style: normal;
}

.story-card h2 {
  margin-bottom: 12px;
  font-family: Georgia, "Times New Roman", "Noto Serif SC", serif;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.05;
}

.detail-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 190px;
  gap: 22px;
  align-items: start;
  padding: clamp(22px, 4vw, 38px);
  border-radius: 8px;
}

.detail-hero h1 {
  font-size: clamp(36px, 5vw, 64px);
}

.progress-summary {
  display: grid;
  gap: 10px;
  padding: 18px;
  background: #1d2b2e;
  color: #fffaf0;
}

.progress-summary span {
  color: rgba(255, 250, 240, 0.68);
  font-size: 13px;
  font-weight: 900;
}

.progress-summary strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 46px;
  line-height: 1;
}

.chapter-slider {
  display: grid;
  gap: 16px;
  overflow: hidden;
  padding: clamp(18px, 3vw, 26px);
  border-radius: 8px;
}

.slider-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
}

.slider-toolbar h2 {
  margin: 8px 0 0;
  font-family: Georgia, "Times New Roman", "Noto Serif SC", serif;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.05;
}

.slider-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-controls span {
  min-width: 52px;
  color: #617073;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

.slider-window {
  overflow: hidden;
}

.chapter-track {
  display: grid;
  grid-auto-columns: 100%;
  grid-auto-flow: column;
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.chapter-slide {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
  min-height: 360px;
  padding: clamp(20px, 4vw, 36px);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 247, 223, 0.9), rgba(255, 252, 243, 0.92)),
    rgba(255, 252, 243, 0.92);
}

.chapter-slide:hover {
  border-color: rgba(29, 43, 46, 0.26);
}

.chapter-slide.locked {
  cursor: not-allowed;
  opacity: 0.58;
}

.chapter-slide.locked:hover {
  transform: none;
}

.chapter-index {
  display: grid;
  place-items: center;
  width: 58px;
  height: 74px;
  border: 1px solid rgba(29, 43, 46, 0.16);
  background: #fff7df;
  color: #1d2b2e;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 32px;
  font-weight: 900;
}

.chapter-slide.completed .chapter-index {
  background: #20483f;
  color: #fffaf0;
}

.chapter-slide.locked .chapter-index {
  background: rgba(29, 43, 46, 0.08);
  color: #617073;
}

.chapter-body {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.chapter-heading span,
.chapter-progress span {
  color: #617073;
  font-size: 13px;
  font-weight: 900;
}

.chapter-heading h2 {
  margin-top: 3px;
  font-family: Georgia, "Times New Roman", "Noto Serif SC", serif;
  font-size: clamp(34px, 6vw, 68px);
  line-height: 1.1;
}

.chapter-progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.progress-bar {
  height: 9px;
  overflow: hidden;
  background: rgba(29, 43, 46, 0.1);
}

.progress-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #20483f, #d89d31);
}

.chapter-action {
  align-self: end;
  justify-self: start;
  min-width: 78px;
  background: rgba(32, 72, 63, 0.1);
  color: #20483f;
}

.chapter-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.chapter-meta div {
  display: grid;
  gap: 4px;
  padding: 14px;
  background: rgba(29, 43, 46, 0.06);
}

.chapter-meta span {
  color: #617073;
  font-size: 12px;
  font-weight: 900;
}

.chapter-meta strong {
  font-size: 18px;
}

.chapter-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.chapter-dots button {
  display: grid;
  place-items: center;
  width: 38px;
  min-width: 38px;
  height: 38px;
  min-height: 38px;
  padding: 0;
  border: 1px solid rgba(29, 43, 46, 0.14);
  background: rgba(255, 252, 243, 0.75);
  color: #617073;
}

.chapter-dots button.active {
  background: #1d2b2e;
  color: #fffaf0;
}

.chapter-dots button.locked {
  opacity: 0.48;
}

.state-panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  min-height: 280px;
  padding: 42px 20px;
  border-radius: 8px;
  text-align: center;
  align-content: center;
}

.state-mark {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(29, 43, 46, 0.14);
  border-top-color: #9b2d26;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.state-panel.error .state-mark {
  animation: none;
  border-color: rgba(155, 45, 38, 0.34);
  background: rgba(155, 45, 38, 0.1);
}

.state-panel strong {
  font-size: 28px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 21, 22, 0.44);
}

.reset-modal {
  display: grid;
  gap: 14px;
  width: min(460px, 100%);
  padding: 26px;
  border-radius: 8px;
}

.reset-modal h2 {
  font-size: 30px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 860px) {
  .story-hero,
  .detail-hero,
  .chapter-slide {
    grid-template-columns: 1fr;
  }

  .slider-toolbar,
  .slider-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .dossier-card,
  .progress-summary {
    width: 100%;
  }

  .chapter-action {
    justify-self: start;
  }
}

@media (max-width: 560px) {
  .story-mode-page {
    padding: 12px;
  }

  .story-hero h1,
  .detail-hero h1 {
    font-size: clamp(34px, 12vw, 52px);
  }

  .hero-actions,
  .modal-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions button,
  .modal-actions button {
    width: 100%;
  }

  .chapter-progress {
    grid-template-columns: 1fr;
  }

  .chapter-meta {
    grid-template-columns: 1fr;
  }
}
</style>
