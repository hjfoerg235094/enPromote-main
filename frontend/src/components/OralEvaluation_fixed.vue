<template>
  <div class="oral-evaluation-container">
    <div class="evaluation-header">
      <h2>英语口语评测</h2>
      <p class="subtitle">录制你的发音，获取专业评分和改进建议</p>
    </div>

    <!-- 评测配置 -->
    <div class="evaluation-config">
      <div class="config-item">
        <label>评测类型：</label>
        <select v-model="evaluationConfig.category">
          <option value="word">单词评测</option>
          <option value="sentence">句子评测</option>
          <option value="paragraph">段落评测</option>
          <option value="free">自由说</option>
        </select>
      </div>
      <div class="config-item">
        <label>难度等级：</label>
        <select v-model="evaluationConfig.level">
          <option value="primary">小学</option>
          <option value="junior">初中</option>
          <option value="senior">高中</option>
          <option value="college">大学</option>
        </select>
      </div>
    </div>

    <!-- 文本输入区域 -->
    <div class="text-input-area">
      <label>待评测文本：</label>
      <textarea
        v-model="evaluationText"
        placeholder="请输入要评测的英文文本..."
        rows="4"
        :disabled="isRecording || isEvaluating"
      ></textarea>
    </div>

    <!-- 录音控制区域 -->
    <div class="recording-controls">
      <button
        @click="toggleRecording"
        :class="['record-button', { recording: isRecording }]"
        :disabled="!evaluationText || isEvaluating"
      >
        <span v-if="!isRecording">开始录音</span>
        <span v-else>停止录音</span>
      </button>

      <div v-if="isRecording" class="recording-indicator">
        <span class="recording-dot"></span>
        <span>录音中... {{ recordingTime }}s</span>
      </div>
    </div>

    <!-- 音频播放区域 -->
    <div v-if="audioUrl" class="audio-playback">
      <audio :src="audioUrl" controls></audio>
      <button @click="playRecording" class="play-button">
        <span>▶️ 播放录音</span>
      </button>
    </div>

    <!-- 提交评测按钮 -->
    <div class="submit-section">
      <button
        @click="submitEvaluation"
        class="submit-button"
        :disabled="!audioBlob || isEvaluating"
      >
        <span v-if="!isEvaluating">提交评测</span>
        <span v-else>评测中...</span>
      </button>
    </div>

    <!-- 评测结果 -->
    <div v-if="evaluationResult" class="evaluation-result">
      <div class="overall-score">
        <h3>总体评分</h3>
        <div class="score-circle" :class="getScoreClass(evaluationResult.overallScore)">
          <span class="score-value">{{ evaluationResult.overallScore.toFixed(1) }}</span>
        </div>
        <p class="overall-advice">{{ evaluationResult.advice.overall }}</p>
      </div>

      <div class="dimensions">
        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">准确度</span>
            <span class="dimension-score">{{ evaluationResult.dimensions.accuracy.toFixed(1) }}</span>
          </div>
          <div class="dimension-bar">
            <div
              class="bar-fill"
              :style="{ width: evaluationResult.dimensions.accuracy + '%' }"
            ></div>
          </div>
          <p class="dimension-advice">{{ evaluationResult.advice.accuracy }}</p>
        </div>

        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">流利度</span>
            <span class="dimension-score">{{ evaluationResult.dimensions.fluency.toFixed(1) }}</span>
          </div>
          <div class="dimension-bar">
            <div
              class="bar-fill"
              :style="{ width: evaluationResult.dimensions.fluency + '%' }"
            ></div>
          </div>
          <p class="dimension-advice">{{ evaluationResult.advice.fluency }}</p>
        </div>

        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">完整度</span>
            <span class="dimension-score">{{ evaluationResult.dimensions.integrity.toFixed(1) }}</span>
          </div>
          <div class="dimension-bar">
            <div
              class="bar-fill"
              :style="{ width: evaluationResult.dimensions.integrity + '%' }"
            ></div>
          </div>
          <p class="dimension-advice">{{ evaluationResult.advice.integrity }}</p>
        </div>

        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">发音质量</span>
            <span class="dimension-score">{{ evaluationResult.dimensions.pronunciation.toFixed(1) }}</span>
          </div>
          <div class="dimension-bar">
            <div
              class="bar-fill"
              :style="{ width: evaluationResult.dimensions.pronunciation + '%' }"
            ></div>
          </div>
          <p class="dimension-advice">{{ evaluationResult.advice.pronunciation }}</p>
        </div>
      </div>

      <!-- 详细信息 -->
      <div v-if="evaluationResult.details" class="details-section">
        <h3>详细分析</h3>

        <!-- 单词级别评分 -->
        <div v-if="evaluationResult.details.words.length > 0" class="words-analysis">
          <h4>单词评分</h4>
          <div class="words-list">
            <div
              v-for="(word, index) in evaluationResult.details.words"
              :key="index"
              class="word-item"
              :class="getWordScoreClass(word.score)"
            >
              <span class="word-text">{{ word.text }}</span>
              <span class="word-score">{{ word.score.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- 音素级别评分 -->
        <div v-if="evaluationResult.details.phonemes.length > 0" class="phonemes-analysis">
          <h4>音素评分</h4>
          <div class="phonemes-list">
            <div
              v-for="(phoneme, index) in evaluationResult.details.phonemes"
              :key="index"
              class="phoneme-item"
              :class="getWordScoreClass(phoneme.score)"
            >
              <span class="phoneme-text">{{ phoneme.text }}</span>
              <span class="phoneme-score">{{ phoneme.score.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 改进建议 -->
      <div class="suggestions-section">
        <h3>改进建议</h3>
        <ul class="suggestions-list">
          <li v-for="(suggestion, index) in getImprovementSuggestions()" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { evaluatePronunciation, type OralEvaluationResult } from '../api/oral_fixed';

// 评测配置
const evaluationConfig = ref({
  category: 'sentence' as const,
  level: 'senior' as const
});

// 限制最长录音时长，避免超出后端上传限制
const MAX_RECORD_SECONDS = 30;

// 评测文本
const evaluationText = ref('');

// 录音状态
const isRecording = ref(false);
const isEvaluating = ref(false);
const recordingTime = ref(0);
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string>('');

// 评测结果
const evaluationResult = ref<OralEvaluationResult | null>(null);

// 错误信息
const errorMessage = ref('');

// 录音相关变量
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: BlobPart[] = [];
let recordingTimer: number | null = null;

// 切换录音状态
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

// 开始录音
const startRecording = async () => {
  try {
    // 清理之前的录音
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value);
      audioUrl.value = '';
    }
    audioChunks = [];
    evaluationResult.value = null;
    errorMessage.value = '';

    // 获取麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 创建 MediaRecorder
    mediaRecorder = new MediaRecorder(stream);

    // 处理录音数据
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // 录音停止处理
    mediaRecorder.onstop = () => {
      audioBlob.value = new Blob(audioChunks, { type: 'audio/wav' });
      audioUrl.value = URL.createObjectURL(audioBlob.value);

      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop());
    };

    // 开始录音
    mediaRecorder.start();
    isRecording.value = true;

    // 开始计时
    recordingTime.value = 0;
    recordingTimer = window.setInterval(() => {
      recordingTime.value++;

      // 到点自动停止，触发 onstop -> 生成音频 blob
      if (recordingTime.value >= MAX_RECORD_SECONDS) {
        stopRecording();
      }
    }, 1000);

  } catch (error) {
    console.error('录音失败:', error);
    errorMessage.value = '无法访问麦克风，请检查权限设置';
  }
};

// 停止录音
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;

    // 停止计时
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = null;
    }
  }
};

// 播放录音
const playRecording = () => {
  if (audioUrl.value) {
    const audio = new Audio(audioUrl.value);
    audio.play();
  }
};

// 提交评测
const submitEvaluation = async () => {
  if (!audioBlob.value) {
    errorMessage.value = '请先录制音频';
    return;
  }

  try {
    isEvaluating.value = true;
    errorMessage.value = '';

    const formData = new FormData();
    formData.append('audio', audioBlob.value, 'recording.wav');
    formData.append('text', evaluationText.value);
    formData.append('category', evaluationConfig.value.category);
    formData.append('level', evaluationConfig.value.level);

    const response = await evaluatePronunciation({
      audio: new File([audioBlob.value], 'recording.wav', { type: 'audio/wav' }),
      text: evaluationText.value,
      category: evaluationConfig.value.category,
      level: evaluationConfig.value.level
    });

    if (response.success && response.data) {
      evaluationResult.value = response.data;
    } else {
      errorMessage.value = response.message || '评测失败，请重试';
    }

  } catch (error) {
    console.error('评测失败:', error);
    errorMessage.value = '评测失败，请重试';
  } finally {
    isEvaluating.value = false;
  }
};

// 获取分数等级样式
const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

// 获取单词分数等级样式
const getWordScoreClass = (score: number) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

// 获取改进建议
const getImprovementSuggestions = () => {
  if (!evaluationResult.value) return [];

  const suggestions: string[] = [];
  const { dimensions, advice } = evaluationResult.value;

  // 根据各维度评分生成建议
  if (dimensions.accuracy < 80) {
    suggestions.push(advice.accuracy);
  }
  if (dimensions.fluency < 80) {
    suggestions.push(advice.fluency);
  }
  if (dimensions.integrity < 80) {
    suggestions.push(advice.integrity);
  }
  if (dimensions.pronunciation < 80) {
    suggestions.push(advice.pronunciation);
  }
  if (dimensions.speed && dimensions.speed < 80) {
    suggestions.push(advice.speed || '');
  }
  if (dimensions.intonation && dimensions.intonation < 80) {
    suggestions.push(advice.intonation || '');
  }

  // 如果所有维度都很好，给出鼓励
  if (suggestions.length === 0) {
    suggestions.push('你的发音非常标准！继续保持！');
  }

  return suggestions;
};

// 清理资源
onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
});
</script>

<style scoped>
.oral-evaluation-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.evaluation-header {
  text-align: center;
  margin-bottom: 30px;
}

.evaluation-header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  color: #718096;
  font-size: 14px;
}

.evaluation-config {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.config-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.config-item label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #4b5563;
}

.config-item select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.text-input-area {
  margin-bottom: 20px;
}

.text-input-area label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #4b5563;
}

.text-input-area textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
}

.text-input-area textarea:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.recording-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.record-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.record-button:hover:not(:disabled) {
  background: #66b1ff;
  transform: scale(1.05);
}

.record-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.record-button.recording {
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
  font-weight: 500;
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

.audio-playback {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.play-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #67c23a;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.play-button:hover {
  background: #85ce61;
}

.submit-section {
  margin-bottom: 30px;
}

.submit-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-button:hover:not(:disabled) {
  background: #66b1ff;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.evaluation-result {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.overall-score {
  text-align: center;
  margin-bottom: 30px;
}

.overall-score h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  border: 4px solid #e5e7eb;
}

.score-circle.excellent {
  border-color: #67c23a;
  background: #f0f9ff;
}

.score-circle.good {
  border-color: #409eff;
  background: #ecf5ff;
}

.score-circle.fair {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.score-circle.poor {
  border-color: #f56c6c;
  background: #fef0f0;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
}

.overall-advice {
  color: #718096;
  font-size: 14px;
}

.dimensions {
  margin-bottom: 30px;
}

.dimension-item {
  margin-bottom: 20px;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dimension-name {
  font-weight: 500;
  color: #4b5563;
}

.dimension-score {
  font-weight: bold;
  color: #2c3e50;
}

.dimension-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.5s ease;
}

.dimension-advice {
  color: #718096;
  font-size: 13px;
  margin: 0;
}

.details-section {
  margin-bottom: 30px;
}

.details-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.words-analysis,
.phonemes-analysis {
  margin-bottom: 20px;
}

.words-analysis h4,
.phonemes-analysis h4 {
  margin-bottom: 10px;
  color: #4b5563;
}

.words-list,
.phonemes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.word-item,
.phoneme-item {
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 10px;
}

.word-item.excellent,
.phoneme-item.excellent {
  background: #f0f9ff;
  border: 1px solid #b3e19d;
}

.word-item.good,
.phoneme-item.good {
  background: #ecf5ff;
  border: 1px solid #a3c9fe;
}

.word-item.fair,
.phoneme-item.fair {
  background: #fdf6ec;
  border: 1px solid #f5d99e;
}

.word-item.poor,
.phoneme-item.poor {
  background: #fef0f0;
  border: 1px solid #fab6b6;
}

.word-text,
.phoneme-text {
  color: #4b5563;
}

.word-score,
.phoneme-score {
  font-weight: bold;
  color: #2c3e50;
}

.suggestions-section {
  margin-bottom: 20px;
}

.suggestions-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestions-list li {
  padding: 10px 15px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-left: 3px solid #409eff;
  border-radius: 4px;
}

.error-message {
  padding: 12px;
  background: #fef0f0;
  border: 1px solid #fab6b6;
  color: #f56c6c;
  border-radius: 6px;
  text-align: center;
}
</style>
