<template>
  <div class="spelling-task">
    <div class="task-header">
      <h3>{{ task.name }}</h3>
      <p>{{ task.description }}</p>
    </div>

    <!-- 目标单词提示 -->
    <div class="target-words">
      <strong>需要拼写的单词:</strong>
      <div class="words-list">
        <span
          v-for="(word, index) in task.requiredWords"
          :key="word"
          class="word-tag"
          :class="{
            current: currentWordIndex === index,
            correct: completedWords.has(word),
            incorrect: incorrectWords.has(word)
          }"
        >
          {{ word }}
        </span>
      </div>
    </div>

    <!-- 提示 -->
    <div v-if="showHints" class="hints">
      <h4>提示:</h4>
      <ul>
        <li v-for="(hint, index) in task.hints" :key="index">{{ hint }}</li>
      </ul>
    </div>

    <!-- 拼写练习区域 -->
    <div v-if="!isCompleted" class="spelling-area">
      <div class="current-word">
        <h4>当前单词:</h4>
        <div class="word-display">
          <span v-if="showWord" class="word">{{ currentWord }}</span>
          <span v-else class="word masked">?????</span>
          <button class="toggle-btn" @click="showWord = !showWord">
            {{ showWord ? '隐藏' : '显示' }}
          </button>
        </div>
      </div>

      <div class="spelling-input">
        <input
          v-model="userSpelling"
          @keyup.enter="checkSpelling"
          placeholder="输入单词拼写"
          :disabled="isChecking"
        />
        <button
          class="check-btn"
          @click="checkSpelling"
          :disabled="!userSpelling.trim() || isChecking"
        >
          检查
        </button>
      </div>

      <div v-if="feedback" class="feedback" :class="feedback.type">
        {{ feedback.message }}
      </div>

      <div class="progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
        <span class="progress-text">
          {{ completedWords.size }} / {{ task.requiredWords.length }}
        </span>
      </div>
    </div>

    <!-- 完成总结 -->
    <div v-else class="completion-summary">
      <h4>练习完成!</h4>
      <div class="stats">
        <div class="stat-item">
          <span class="label">正确:</span>
          <span class="value correct">{{ completedWords.size }}</span>
        </div>
        <div class="stat-item">
          <span class="label">错误:</span>
          <span class="value incorrect">{{ incorrectWords.size }}</span>
        </div>
        <div class="stat-item">
          <span class="label">正确率:</span>
          <span class="value">{{ correctRate }}%</span>
        </div>
      </div>

      <button class="complete-btn" @click="completeTask">完成任务</button>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="hint-btn" @click="showHints = !showHints" :disabled="isCompleted">
        💡 提示
      </button>
      <button class="cancel-btn" @click="$emit('cancel')" :disabled="isCompleted">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  task: any;
}>();

const emit = defineEmits(['complete', 'cancel']);

const currentWordIndex = ref(0);
const userSpelling = ref('');
const showWord = ref(false);
const showHints = ref(false);
const isChecking = ref(false);
const isCompleted = ref(false);
const completedWords = ref<Set<string>>(new Set());
const incorrectWords = ref<Set<string>>(new Set());
const feedback = ref<{ type: string; message: string } | null>(null);

const currentWord = computed(() => props.task.requiredWords[currentWordIndex.value]);

const progressPercentage = computed(() => {
  const total = props.task.requiredWords.length;
  const completed = completedWords.value.size;
  return (completed / total) * 100;
});

const correctRate = computed(() => {
  const total = completedWords.value.size + incorrectWords.value.size;
  if (total === 0) return 0;
  return Math.round((completedWords.value.size / total) * 100);
});

function checkSpelling() {
  if (!userSpelling.value.trim() || isChecking.value) return;

  isChecking.value = true;
  const spelling = userSpelling.value.trim().toLowerCase();
  const correct = currentWord.value.toLowerCase();

  if (spelling === correct) {
    completedWords.value.add(currentWord.value);
    feedback.value = {
      type: 'success',
      message: '✓ 正确！'
    };

    // 延迟后进入下一个单词
    setTimeout(() => {
      feedback.value = null;
      moveToNextWord();
    }, 1000);
  } else {
    incorrectWords.value.add(currentWord.value);
    feedback.value = {
      type: 'error',
      message: `✗ 错误。正确拼写是: ${correct}`
    };

    // 延迟后进入下一个单词
    setTimeout(() => {
      feedback.value = null;
      moveToNextWord();
    }, 2000);
  }

  userSpelling.value = '';
  isChecking.value = false;
}

function moveToNextWord() {
  if (currentWordIndex.value < props.task.requiredWords.length - 1) {
    currentWordIndex.value++;
    showWord.value = false;
  } else {
    isCompleted.value = true;
  }
}

function completeTask() {
  emit('complete', {
    correctRate: correctRate.value,
    correctWords: Array.from(completedWords.value),
    incorrectWords: Array.from(incorrectWords.value)
  });
}
</script>

<style scoped>
.spelling-task {
  max-width: 800px;
  margin: 0 auto;
}

.task-header {
  margin-bottom: 20px;
}

.task-header h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.task-header p {
  margin: 0;
  color: #666;
}

.target-words {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.target-words strong {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.word-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #e8f4ff;
  color: #409eff;
  border-radius: 16px;
  font-size: 13px;
  transition: all 0.3s;
}

.word-tag.current {
  background: #409eff;
  color: white;
  font-weight: bold;
}

.word-tag.correct {
  background: #67c23a;
  color: white;
}

.word-tag.incorrect {
  background: #f56c6c;
  color: white;
}

.hints {
  background: #fff7e6;
  border-left: 4px solid #faad14;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.hints h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.hints ul {
  margin: 0;
  padding-left: 20px;
}

.hints li {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.spelling-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.current-word {
  margin-bottom: 20px;
}

.current-word h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.word-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.word {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  letter-spacing: 2px;
}

.word.masked {
  color: #999;
}

.toggle-btn {
  background: #f5f5f5;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #e0e0e0;
}

.spelling-input {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.spelling-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  letter-spacing: 1px;
}

.spelling-input input:focus {
  outline: none;
  border-color: #409eff;
}

.spelling-input input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.check-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.check-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.feedback {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
  font-weight: bold;
}

.feedback.success {
  background: #f0f9ff;
  color: #67c23a;
  border: 1px solid #b3e19d;
}

.feedback.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fab6b6;
}

.progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  min-width: 60px;
}

.completion-summary {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.completion-summary h4 {
  margin: 0 0 16px 0;
  color: #333;
  text-align: center;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
}

.stat-item .value.correct {
  color: #67c23a;
}

.stat-item .value.incorrect {
  color: #f56c6c;
}

.complete-btn {
  width: 100%;
  background: #67c23a;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.complete-btn:hover {
  background: #85ce61;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.hint-btn,
.cancel-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.hint-btn {
  background: #f5f5f5;
  color: #666;
}

.hint-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.hint-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
