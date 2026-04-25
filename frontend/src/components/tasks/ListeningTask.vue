<template>
  <div class="listening-task">
    <div class="task-header">
      <h3>{{ task.name }}</h3>
      <p>{{ task.description }}</p>
    </div>

    <!-- 目标单词提示 -->
    <div class="target-words">
      <strong>重点词汇:</strong>
      <div class="words-list">
        <span
          v-for="word in task.requiredWords"
          :key="word"
          class="word-tag"
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

    <!-- 听力练习区域 -->
    <div v-if="!isCompleted" class="listening-area">
      <!-- 音频播放器 -->
      <div class="audio-player">
        <button
          class="play-btn"
          @click="togglePlay"
          :disabled="isLoading || !listeningText"
        >
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <div class="progress-bar" @click="seekAudio">
          <div
            class="progress-fill"
            :style="{ width: audioProgress + '%' }"
          ></div>
        </div>
        <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>

      <!-- 问题区域 -->
      <div class="questions">
        <div
          v-for="(question, index) in questions"
          :key="index"
          class="question-card"
          :class="{ answered: userAnswers[index] !== undefined }"
        >
          <h4>问题 {{ index + 1 }}</h4>
          <p>{{ question.question }}</p>
          <div class="options">
            <label
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              class="option"
              :class="{
                selected: userAnswers[index] === optIndex,
                correct: showResults && optIndex === question.correctAnswer,
                incorrect: showResults && userAnswers[index] === optIndex && optIndex !== question.correctAnswer
              }"
            >
              <input
                type="radio"
                :name="'question-' + index"
                :value="optIndex"
                v-model="userAnswers[index]"
                :disabled="showResults"
              />
              <span>{{ option }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button
          class="check-btn"
          @click="checkAnswers"
          :disabled="!allAnswered || showResults"
        >
          检查答案
        </button>
        <button
          v-if="showResults"
          class="complete-btn"
          @click="completeTask"
        >
          完成任务
        </button>
      </div>
    </div>

    <!-- 完成总结 -->
    <div v-else class="completion-summary">
      <h4>听力练习完成!</h4>
      <div class="stats">
        <div class="stat-item">
          <span class="label">正确:</span>
          <span class="value correct">{{ correctCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">错误:</span>
          <span class="value incorrect">{{ incorrectCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">正确率:</span>
          <span class="value">{{ correctRate }}%</span>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-actions">
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
import { ref, computed, onMounted } from 'vue';
import { generateListeningContent } from '@/api/listening';

const props = defineProps<{
  task: any;
}>();

const emit = defineEmits(['complete', 'cancel']);

const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const audioProgress = ref(0);
const showHints = ref(false);
const showResults = ref(false);
const isCompleted = ref(false);
const userAnswers = ref<Record<number, number>>({});
const listeningText = ref('');
const questions = ref<any[]>([]);
let speechSynth: SpeechSynthesis | null = null;
let speechUtterance: SpeechSynthesisUtterance | null = null;

const allAnswered = computed(() => {
  return Object.keys(userAnswers.value).length === questions.value.length;
});

const correctCount = computed(() => {
  return questions.value.filter((q, index) => userAnswers.value[index] === q.correctAnswer).length;
});

const incorrectCount = computed(() => {
  return questions.value.filter((q, index) => userAnswers.value[index] !== undefined && userAnswers.value[index] !== q.correctAnswer).length;
});

const correctRate = computed(() => {
  const total = questions.value.length;
  if (total === 0) return 0;
  return Math.round((correctCount.value / total) * 100);
});

function togglePlay() {
  if (!listeningText.value) {
    console.error('没有听力内容');
    return;
  }

  if (isPlaying.value) {
    // 暂停
    window.speechSynthesis.cancel();
    isPlaying.value = false;
    return;
  }

  try {
    // --------------- 核心修复：容错模式 ---------------
    const synth = window.speechSynthesis;
    synth.cancel(); // 先清空

    const cleanText = listeningText.value
      .replace(/[^\x00-\x7F]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance();
    utterance.text = cleanText;
    
    // ✅ 关键：不强制 en-US，不指定 voice，让系统自己选
    utterance.rate = 0.75;
    utterance.pitch = 1;
    utterance.volume = 1;

    // ✅ 错误不弹窗、不崩溃
    utterance.onerror = (e) => {
      console.log("语音不可用（无英文语音包），已跳过播放");
      isPlaying.value = false;
    };

    utterance.onend = () => {
      isPlaying.value = false;
      currentTime.value = duration.value;
      audioProgress.value = 100;
    };

    // 开始播放
    synth.speak(utterance);
    isPlaying.value = true;

    // 进度条模拟
    const wordCount = cleanText.split(/\s+/).length;
    duration.value = Math.ceil(wordCount * 0.8);
    currentTime.value = 0;
    audioProgress.value = 0;

    const timer = setInterval(() => {
      if (!isPlaying.value) {
        clearInterval(timer);
        return;
      }
      currentTime.value += 1;
      audioProgress.value = (currentTime.value / duration.value) * 100;
      if (currentTime.value >= duration.value) {
        clearInterval(timer);
        isPlaying.value = false;
      }
    }, 1000);

  } catch (err) {
    console.error("语音播放异常", err);
    isPlaying.value = false;
  }
}

function seekAudio(event: MouseEvent) {
  // 语音合成不支持跳转，这里只是更新UI
  const progressBar = event.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  currentTime.value = Math.round(percent * duration.value);
  audioProgress.value = percent * 100;

  // 如果正在播放，需要重新开始
  if (isPlaying.value) {
    speechSynth?.cancel();
    isPlaying.value = false;
  }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function checkAnswers() {
  showResults.value = true;
}

function completeTask() {
  isCompleted.value = true;
  emit('complete', {
    correctAnswers: correctCount.value,
    totalQuestions: questions.value.length,
    correctRate: correctRate.value
  });
}

// 组件挂载时生成听力内容
onMounted(async () => {
  try {
    isLoading.value = true;
    console.log('开始生成听力内容，任务信息:', props.task);

    const requestData = {
      scene: props.task.scene || props.task.description || '通用场景',
      targetWords: props.task.requiredWords || [],
      difficulty: '中级',
      questionCount: 3
    };
    console.log('请求数据:', requestData);

    const response = await generateListeningContent(requestData);
    console.log('API响应:', response);

    if (response && response.success && response.data) {
      listeningText.value = response.data.listeningText;
      questions.value = response.data.questions;
      console.log('听力内容生成成功:', { listeningText: listeningText.value, questions: questions.value });
    } else {
      console.error('生成听力内容失败:', response?.message || '未知错误');
    }
  } catch (error) {
    console.error('生成听力内容失败:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.listening-task {
  max-width: 900px;
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

.listening-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #409eff;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.play-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.play-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.1s linear;
}

.time {
  font-size: 14px;
  color: #666;
  min-width: 100px;
  text-align: right;
}

.questions {
  margin-bottom: 24px;
}

.question-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid transparent;
  transition: all 0.3s;
}

.question-card.answered {
  border-left-color: #409eff;
}

.question-card h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.question-card p {
  margin: 0 0 12px 0;
  color: #666;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.option:hover:not(:has(input:disabled)) {
  background: #f0f7ff;
}

.option.selected {
  background: #e8f4ff;
  border: 1px solid #409eff;
}

.option.correct {
  background: #f0f9ff;
  border: 1px solid #67c23a;
}

.option.incorrect {
  background: #fef0f0;
  border: 1px solid #f56c6c;
}

.option input[type="radio"] {
  margin: 0;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.check-btn,
.complete-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.check-btn {
  background: #409eff;
  color: white;
}

.check-btn:hover:not(:disabled) {
  background: #66b1ff;
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.complete-btn {
  background: #67c23a;
  color: white;
}

.complete-btn:hover {
  background: #85ce61;
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
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
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

.bottom-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.hint-btn,
.cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.hint-btn {
  background: #faad14;
  color: white;
}

.hint-btn:hover:not(:disabled) {
  background: #ffc53d;
}

.hint-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #e0e0e0;
}
</style>
