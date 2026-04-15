<template>
  <div class="oral-task">
    <div class="task-header">
      <h3>{{ task.name }}</h3>
      <p>{{ task.description }}</p>
    </div>

    <!-- 目标单词提示 -->
    <div class="target-words">
      <strong>需要朗读的单词:</strong>
      <div class="words-list">
        <span
          v-for="(word, index) in task.requiredWords"
          :key="word"
          class="word-tag"
          :class="{
            current: currentWordIndex === index,
            completed: completedWords.has(word)
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

    <!-- 口语评测区域 -->
    <div v-if="!isCompleted" class="oral-area">
      <div class="current-word">
        <h4>当前单词:</h4>
        <div class="word-display">
          <span class="word">{{ currentWord }}</span>
        </div>
      </div>

      <div class="recording-area">
        <button
          class="record-btn"
          @click="toggleRecording"
          :class="{ recording: isRecording }"
          :disabled="isEvaluating"
        >
          <span v-if="!isRecording">🎤 开始录音</span>
          <span v-else>⏹️ 停止录音</span>
        </button>

        <div v-if="isRecording" class="recording-indicator">
          <span class="recording-dot"></span>
          <span>录音中...</span>
        </div>

        <div v-if="isEvaluating" class="evaluating-indicator">
          <span>评测中...</span>
        </div>
      </div>

      <div v-if="evaluationResult" class="evaluation-result">
        <div class="score-display">
          <span class="score-label">得分:</span>
          <span class="score-value" :class="{ high: evaluationResult.overallScore >= 80, medium: evaluationResult.overallScore >= 60 }">
            {{ evaluationResult.overallScore }}
          </span>
        </div>

        <div v-if="evaluationResult.advice" class="advice">
          <strong>建议:</strong>
          <p>{{ evaluationResult.advice.overall }}</p>
        </div>

        <div class="dimensions">
          <div class="dimension">
            <span class="dimension-label">准确度:</span>
            <span class="dimension-value">{{ evaluationResult.dimensions.accuracy }}</span>
          </div>
          <div class="dimension">
            <span class="dimension-label">流利度:</span>
            <span class="dimension-value">{{ evaluationResult.dimensions.fluency }}</span>
          </div>
          <div class="dimension">
            <span class="dimension-label">完整度:</span>
            <span class="dimension-value">{{ evaluationResult.dimensions.integrity }}</span>
          </div>
          <div class="dimension">
            <span class="dimension-label">发音:</span>
            <span class="dimension-value">{{ evaluationResult.dimensions.pronunciation }}</span>
          </div>
        </div>
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
          <span class="label">已完成:</span>
          <span class="value completed">{{ completedWords.size }}</span>
        </div>
        <div class="stat-item">
          <span class="label">平均分:</span>
          <span class="value score">{{ averageScore }}</span>
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
import { ref, computed, onUnmounted } from 'vue';
import { evaluatePronunciation } from '@/api/oral';

const props = defineProps<{
  task: any;
}>();

const emit = defineEmits(['complete', 'cancel']);

const currentWordIndex = ref(0);
const showHints = ref(false);
const isRecording = ref(false);
const isEvaluating = ref(false);
const recordingTime = ref(0);
const isCompleted = ref(false);
const completedWords = ref<Set<string>>(new Set());
const wordScores = ref<Map<string, number>>(new Map());
const evaluationResult = ref<any>(null);
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

// 限制最长录音时长，避免超出后端上传限制
const MAX_RECORD_SECONDS = 30;
let recordingTimer: number | null = null;

const currentWord = computed(() => props.task.requiredWords[currentWordIndex.value]);

const progressPercentage = computed(() => {
  const total = props.task.requiredWords.length;
  const completed = completedWords.value.size;
  return (completed / total) * 100;
});

const averageScore = computed(() => {
  if (wordScores.value.size === 0) return 0;
  const total = Array.from(wordScores.value.values()).reduce((sum, score) => sum + score, 0);
  return Math.round(total / wordScores.value.size);
});

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      await evaluateAudio(audioBlob);
    };

    mediaRecorder.start();
    isRecording.value = true;
    evaluationResult.value = null;

    // 开始计时（到点自动停止并进入 onstop -> 评测流程）
    recordingTime.value = 0;
    recordingTimer = window.setInterval(() => {
      recordingTime.value++;
      if (recordingTime.value >= MAX_RECORD_SECONDS) {
        stopRecording();
      }
    }, 1000);
  } catch (error) {
    console.error('录音失败:', error);
    alert('无法访问麦克风，请检查权限设置');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    isRecording.value = false;

    // 停止计时
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
  }
}

async function evaluateAudio(audioBlob: any) {
  isEvaluating.value = true;

  try {
    // `evaluatePronunciation` 需要的是 { audio: File, text: string, category?, level? }
    // 这里不要直接传 FormData，避免参数结构不匹配导致后端接不到 text/audio。
    const audioFile = new File([audioBlob], 'recording.wav', {
      type: audioBlob?.type || 'audio/wav',
    });

    const result = await evaluatePronunciation({
      audio: audioFile,
      text: currentWord.value,
      category: 'word',
      level: 'senior',
    });

    if (result.success && result.data) {
      evaluationResult.value = result.data;
      wordScores.value.set(currentWord.value, result.data.overallScore);

      // 如果得分达到60分，视为完成
      if (result.data.overallScore >= 60) {
        completedWords.value.add(currentWord.value);
      }

      // 延迟后进入下一个单词
      setTimeout(() => {
        moveToNextWord();
      }, 2000);
    } else {
      throw new Error(result.message || '评测失败');
    }
  } catch (error) {
    console.error('评测失败:', error);
    alert('评测失败，请重试');
  } finally {
    isEvaluating.value = false;
  }
}

function moveToNextWord() {
  evaluationResult.value = null;
  if (currentWordIndex.value < props.task.requiredWords.length - 1) {
    currentWordIndex.value++;
  } else {
    isCompleted.value = true;
  }
}

function completeTask() {
  emit('complete', {
    correctRate: averageScore.value,
    completedWords: Array.from(completedWords.value),
    wordScores: Array.from(wordScores.value.entries()).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, number>)
  });
}

// 清理资源
onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
  }
});
</script>

<style scoped>
.oral-task {
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

.word-tag.completed {
  background: #67c23a;
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

.oral-area {
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
  font-size: 32px;
  font-weight: bold;
  color: #333;
  letter-spacing: 2px;
}

.recording-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.record-btn {
  background: #409eff;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-btn:hover:not(:disabled) {
  background: #66b1ff;
  transform: scale(1.05);
}

.record-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.record-btn.recording {
  background: #f56c6c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  font-weight: bold;
}

.recording-dot {
  width: 10px;
  height: 10px;
  background: #f56c6c;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.evaluating-indicator {
  color: #409eff;
  font-weight: bold;
}

.evaluation-result {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.score-label {
  font-weight: bold;
  color: #333;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  color: #f56c6c;
}

.score-value.medium {
  color: #e6a23c;
}

.score-value.high {
  color: #67c23a;
}

.advice {
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.advice strong {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.advice p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.dimensions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.dimension {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}

.dimension-label {
  color: #666;
}

.dimension-value {
  font-weight: bold;
  color: #333;
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
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  gap: 8px;
}

.stat-item .label {
  color: #666;
}

.stat-item .value {
  font-weight: bold;
  font-size: 18px;
}

.stat-item .value.completed {
  color: #67c23a;
}

.stat-item .value.score {
  color: #409eff;
}

.complete-btn {
  width: 100%;
  background: #67c23a;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.complete-btn:hover {
  background: #85ce61;
}

.actions {
  display: flex;
  gap: 12px;
}

.hint-btn,
.cancel-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.hint-btn {
  background: #fff7e6;
  color: #faad14;
}

.hint-btn:hover:not(:disabled) {
  background: #ffe58f;
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
