
<template>
  <div class="story-tree">
    <div class="tree-header">
      <h2>剧情树</h2>
      <p class="description">查看剧情分支和可能的结局</p>
    </div>

    <div class="tree-container" ref="treeContainer">
      <div class="tree-canvas" :style="{ transform: `scale(${zoom})` }">
        <div
          v-for="chapter in storyTree.chapters"
          :key="chapter.chapterId"
          class="chapter-node"
          :class="{ 'current': isCurrentChapter(chapter.chapterId) }"
          :style="getChapterPosition(chapter.chapterId)"
        >
          <div class="chapter-card">
            <div class="chapter-header">
              <span class="chapter-id">{{ chapter.chapterId }}</span>
              <h3>{{ chapter.title }}</h3>
            </div>
            <p class="chapter-scene">{{ chapter.scene }}</p>

            <div class="task-branches">
              <div
                v-for="task in chapter.tasks"
                :key="task.taskId"
                class="task-node"
              >
                <div class="task-info">
                  <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
                  <span class="task-name">{{ task.name }}</span>
                </div>

                <div v-if="task.branches && task.branches.length > 0" class="branches">
                  <div
                    v-for="branch in task.branches"
                    :key="branch.choiceId"
                    class="branch"
                    :class="{ 'taken': isBranchTaken(branch.choiceId) }"
                  >
                    <div class="branch-content">
                      <span class="branch-icon">{{ getBranchIcon(branch.choiceId) }}</span>
                      <span class="branch-text">{{ branch.choiceText }}</span>
                    </div>
                    <div v-if="branch.outcome" class="branch-outcome">
                      结局: {{ branch.outcome }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 连接线 -->
          <div
            v-if="chapter.chapterId < storyTree.chapters.length"
            class="connection-line"
            :style="getConnectionLinePosition(chapter.chapterId)"
          ></div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="tree-controls">
      <button class="control-btn" @click="zoomIn" title="放大">
        <span>+</span>
      </button>
      <button class="control-btn" @click="zoomOut" title="缩小">
        <span>-</span>
      </button>
      <button class="control-btn" @click="resetZoom" title="重置">
        <span>⟲</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps<{
  storyId: string;
  currentChapterId?: number;
  takenChoices?: string[];
}>();

const storyTree = ref<any>(null);
const zoom = ref(1);
const treeContainer = ref<HTMLElement | null>(null);

onMounted(async () => {
  await fetchStoryTree();
});

async function fetchStoryTree() {
  try {
    const response = await axios.get(`/api/story/${props.storyId}/tree`);
    storyTree.value = response.data.data;
  } catch (error) {
    console.error('获取剧情树失败:', error);
  }
}

function isCurrentChapter(chapterId: number) {
  return chapterId === props.currentChapterId;
}

function isBranchTaken(choiceId: string) {
  return props.takenChoices?.includes(choiceId);
}

function getChapterPosition(chapterId: number) {
  const level = Math.floor((chapterId - 1) / 2);
  const position = (chapterId - 1) % 2;

  return {
    left: `${position * 50 + 5}%`,
    top: `${level * 300 + 20}px`
  };
}

function getConnectionLinePosition(chapterId: number) {
  const currentLevel = Math.floor((chapterId - 1) / 2);
  const currentPosition = (chapterId - 1) % 2;

  return {
    left: `${currentPosition * 50 + 20}%`,
    top: `${currentLevel * 300 + 280}px`,
    height: '20px'
  };
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

function getBranchIcon(choiceId: string) {
  const icons: Record<string, string> = {
    confront: '⚔️',
    evade: '🛡️',
    contact: '🤝',
    trust: '💙',
    investigate: '🔍',
    report: '📋'
  };
  return icons[choiceId] || '❓';
}

function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.1, 2);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.1, 0.5);
}

function resetZoom() {
  zoom.value = 1;
}
</script>

<style scoped>
.story-tree {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  border-radius: 12px;
  overflow: hidden;
}

.tree-header {
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.tree-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.tree-container {
  position: relative;
  width: 100%;
  height: calc(100% - 100px);
  overflow: auto;
}

.tree-canvas {
  position: relative;
  min-width: 100%;
  min-height: 100%;
  transition: transform 0.3s ease;
}

.chapter-node {
  position: absolute;
  width: 40%;
  transition: all 0.3s ease;
}

.chapter-node.current {
  z-index: 10;
}

.chapter-node.current .chapter-card {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.chapter-card {
  background: white;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.chapter-id {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.chapter-card h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  flex: 1;
}

.chapter-scene {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 13px;
}

.task-branches {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-node {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.task-type {
  display: inline-block;
  padding: 2px 8px;
  background: #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.task-name {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.branches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.branch {
  padding: 8px;
  background: white;
  border-left: 3px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.branch.taken {
  border-left-color: #67c23a;
  background: #f0f9ff;
}

.branch-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.branch-icon {
  font-size: 18px;
}

.branch-text {
  color: #333;
  font-size: 13px;
}

.branch-outcome {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.connection-line {
  position: absolute;
  width: 2px;
  background: #e4e7ed;
  transform-origin: top center;
}

.tree-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #666;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: #409eff;
  color: white;
  border-color: #409eff;
}
</style>
