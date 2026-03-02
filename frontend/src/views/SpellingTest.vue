<template>
  <div class="spelling-test-page">
    <div class="page-header">
      <h1>拼写练习测试</h1>
      <p>测试拼写组件功能</p>
    </div>

    <div class="test-controls">
      <div class="word-selector">
        <label>选择测试单词：</label>
        <select v-model="selectedWord" @change="changeWord">
          <option v-for="word in testWords" :key="word" :value="word">
            {{ word }}
          </option>
        </select>
      </div>
      
      <div class="current-word-display">
        <strong>当前单词：{{ currentWord }}</strong>
      </div>
    </div>

    <!-- 拼写组件 -->
    <Spelling 
      :currentWord="currentWord"
      @complete="handleSpellingComplete"
      @next="handleNext"
    />

    <!-- 结果历史 -->
    <div v-if="results.length > 0" class="results-history">
      <h3>练习历史</h3>
      <div class="results-list">
        <div 
          v-for="(result, index) in results" 
          :key="index"
          class="result-item"
          :class="{ 'correct': result.isCorrect, 'incorrect': !result.isCorrect }"
        >
          <span class="result-icon">{{ result.isCorrect ? '✅' : '❌' }}</span>
          <span class="word">{{ result.word }}</span>
          <span class="user-input">{{ result.userInput }}</span>
          <span class="timestamp">{{ formatTime(result.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Spelling from '@/components/spelling.vue';

// 测试单词列表
const testWords = [
  'hello',
  'world',
  'javascript',
  'vue',
  'component',
  'spelling',
  'practice',
  'keyboard',
  'computer',
  'programming'
];

// 响应式数据
const selectedWord = ref('hello');
const currentWord = ref('hello');
const results = ref([]);

// 方法
const changeWord = () => {
  currentWord.value = selectedWord.value;
};

const handleSpellingComplete = (result) => {
  console.log('拼写完成:', result);
  
  // 添加到结果历史
  results.value.unshift({
    ...result,
    timestamp: new Date()
  });
  
  // 限制历史记录数量
  if (results.value.length > 10) {
    results.value = results.value.slice(0, 10);
  }
};

const handleNext = () => {
  // 随机选择下一个单词
  const currentIndex = testWords.indexOf(currentWord.value);
  let nextIndex = Math.floor(Math.random() * testWords.length);
  
  // 确保不是同一个单词
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * testWords.length);
  }
  
  currentWord.value = testWords[nextIndex];
  selectedWord.value = testWords[nextIndex];
};

const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString();
};

// 生命周期
onMounted(() => {
  console.log('拼写测试页面已加载');
});
</script>

<style scoped>
.spelling-test-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.2rem;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.test-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 16px;
}

.word-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-selector label {
  font-weight: 600;
  color: #333;
}

.word-selector select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.word-selector select:focus {
  outline: none;
  border-color: #3498db;
}

.current-word-display {
  color: #3498db;
  font-size: 1.1rem;
}

.results-history {
  margin-top: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.results-history h3 {
  margin-bottom: 16px;
  color: #333;
  text-align: center;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.result-item.correct {
  border-left-color: #27ae60;
}

.result-item.incorrect {
  border-left-color: #e74c3c;
}

.result-icon {
  font-size: 1.2rem;
}

.word {
  font-weight: 600;
  color: #333;
  min-width: 100px;
}

.user-input {
  color: #666;
  font-family: 'Courier New', monospace;
  min-width: 100px;
}

.timestamp {
  color: #999;
  font-size: 0.9rem;
  margin-left: auto;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .test-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .word-selector {
    justify-content: center;
  }
  
  .current-word-display {
    text-align: center;
  }
  
  .result-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .timestamp {
    margin-left: 0;
    width: 100%;
    text-align: center;
  }
}
</style>
