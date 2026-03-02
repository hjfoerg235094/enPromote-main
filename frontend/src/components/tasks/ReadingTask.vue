<template>
  <div class="reading-task">
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

    <!-- 阅读练习区域 -->
    <div v-if="!isCompleted" class="reading-area">
      <!-- 阅读材料 -->
      <div class="reading-material">
        <h4>阅读材料</h4>
        <div class="content">
          <p v-for="(paragraph, index) in paragraphs" :key="index">
            {{ paragraph }}
          </p>
        </div>
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
          <p>{{ question.text }}</p>
          <div class="options">
            <label
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              class="option"
              :class="{
                selected: userAnswers[index] === optIndex,
                correct: showResults && optIndex === question.correct,
                incorrect: showResults && userAnswers[index] === optIndex && optIndex !== question.correct
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
      <h4>阅读练习完成!</h4>
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
import { ref, computed } from 'vue';

const props = defineProps<{
  task: any;
}>();

const emit = defineEmits(['complete', 'cancel']);

const showHints = ref(false);
const showResults = ref(false);
const isCompleted = ref(false);
const userAnswers = ref<Record<number, number>>({});

// 模拟阅读材料段落
const paragraphs = ref([
  'Welcome to the Grand Hotel, where luxury meets comfort. Our establishment has been serving discerning travelers for over 50 years, offering exceptional service and world-class amenities.',
  'Upon arrival, guests are greeted by our professional concierge team who are available 24/7 to assist with any requests. From arranging airport transfers to booking exclusive restaurant reservations, our staff ensures every need is met.',
  'The hotel features 200 elegantly appointed rooms and suites, each equipped with modern amenities including high-speed internet, premium bedding, and stunning city views. Our spa and wellness center offers a range of treatments designed to rejuvenate both body and mind.',
  'Dining options at the Grand Hotel are second to none. Our award-winning restaurant serves exquisite international cuisine, while the rooftop bar provides the perfect setting for evening cocktails with panoramic views of the city skyline.'
]);

// 模拟阅读理解问题
const questions = ref([
  {
    text: 'How long has the Grand Hotel been serving travelers?',
    options: ['Over 30 years', 'Over 50 years', 'Over 70 years', 'Over 100 years'],
    correct: 1
  },
  {
    text: 'What service is available 24/7 at the hotel?',
    options: ['Room service', 'Concierge service', 'Spa treatments', 'Restaurant reservations'],
    correct: 1
  },
  {
    text: 'How many rooms and suites does the hotel feature?',
    options: ['100 rooms and suites', '150 rooms and suites', '200 rooms and suites', '250 rooms and suites'],
    correct: 2
  },
  {
    text: 'What can guests enjoy at the rooftop bar?',
    options: ['Spa treatments', 'Fine dining', 'Evening cocktails with city views', 'Swimming'],
    correct: 2
  }
]);

const allAnswered = computed(() => {
  return Object.keys(userAnswers.value).length === questions.value.length;
});

const correctCount = computed(() => {
  return questions.value.filter((q, index) => userAnswers.value[index] === q.correct).length;
});

const incorrectCount = computed(() => {
  return questions.value.filter((q, index) => userAnswers.value[index] !== undefined && userAnswers.value[index] !== q.correct).length;
});

const correctRate = computed(() => {
  const total = questions.value.length;
  if (total === 0) return 0;
  return Math.round((correctCount.value / total) * 100);
});

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
</script>

<style scoped>
.reading-task {
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

.reading-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.reading-material {
  margin-bottom: 24px;
}

.reading-material h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  line-height: 1.8;
}

.content p {
  margin: 0 0 12px 0;
  color: #333;
}

.content p:last-child {
  margin-bottom: 0;
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

.bottom-actions {
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
