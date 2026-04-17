
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

      <button
        @click="playRecording"
        :disabled="!audioBlob || isRecording || isEvaluating"
        class="play-button"
      >
        播放录音
      </button>

      <button
        @click="submitEvaluation"
        :disabled="!audioBlob || isEvaluating"
        class="evaluate-button"
      >
        <span v-if="!isEvaluating">提交评测</span>
        <span v-else>评测中...</span>
      </button>
    </div>

    <!-- 录音状态显示 -->
    <div v-if="isRecording" class="recording-status">
      <div class="recording-indicator"></div>
      <span>录音中... {{ recordingTime }}s</span>
    </div>

    <!-- 评测结果区域 -->
    <div v-if="evaluationResult" class="evaluation-result">
      <h3>评测结果</h3>

      <!-- 总体评分 -->
      <div class="overall-score">
        <div class="score-circle" :class="getScoreClass(evaluationResult.overallScore)">
          <span class="score-value">{{ evaluationResult.overallScore.toFixed(1) }}</span>
          <span class="score-label">总分</span>
        </div>
        <p class="overall-advice">{{ evaluationResult.advice.overall }}</p>
      </div>

      <!-- 维度评分 -->
      <div class="dimension-scores">
        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">发音准确度</span>
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

        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">语速</span>
            <span class="dimension-score">{{ (evaluationResult.dimensions.speed || 0).toFixed(1) }}</span>
          </div>
          <div class="dimension-bar">
            <div
              class="bar-fill"
              :style="{ width: (evaluationResult.dimensions.speed || 0) + '%' }"
            ></div>
          </div>
          <p class="dimension-advice">{{ evaluationResult.advice.speed || '' }}</p>
        </div>

        <div class="dimension-item">
          <div class="dimension-header">
            <span class="dimension-name">声调/语调</span>
            <span class="dimension-score">{{ (evaluationResult.dimensions.intonation || 0).toFixed(1) }}</span>
          </div>
          <div class="dimension-bar">
            <div
              class="bar-fill"
              :style="{ width: (evaluationResult.dimensions.intonation || 0) + '%' }"
            ></div>
          </div>
          <p class="dimension-advice">{{ evaluationResult.advice.intonation || '' }}</p>
        </div>
      </div>

      <!-- 详细分析 -->
      <div class="detailed-analysis">
        <h4>详细分析</h4>
        <div class="word-analysis">
          <div v-for="(word, index) in evaluationResult.details.words" :key="index" class="word-item">
            <span class="word-text">{{ word.text }}</span>
            <span 
              class="word-score"
              :class="getWordScoreClass(word.score)"
            >
              {{ word.score.toFixed(1) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 改进建议 -->
      <div class="improvement-suggestions">
        <h4>改进建议</h4>
        <ul>
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
import { evaluatePronunciation, type OralEvaluationResult } from '../api/oral';

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

    const response = await evaluatePronunciation({
      audio: new File([audioBlob.value], 'recording.webm', { type: 'audio/webm' }),
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
  // 显示更详细的错误信息
  if (error instanceof Error) {
    errorMessage.value = `评测失败: ${error.message}`;
  } else if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { message?: string }; status: number } };
    if (err.response) {
      errorMessage.value = err.response.data?.message || `评测失败: ${err.response.status}`;
    } else {
      errorMessage.value = '评测失败，请重试';
    }
  } else {
    errorMessage.value = '评测失败，请重试';
  }
}

 finally {
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
  color: #7f8c8d;
  font-size: 0.95em;
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
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-item label {
  font-weight: 500;
  color: #2c3e50;
}

.config-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.text-input-area {
  margin-bottom: 20px;
}

.text-input-area label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.text-input-area textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

.text-input-area textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.recording-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: center;
}

.record-button {
  padding: 12px 24px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.record-button:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
}

.record-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.record-button.recording {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.play-button {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.play-button:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.play-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.evaluate-button {
  padding: 12px 24px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.evaluate-button:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-2px);
}

.evaluate-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.recording-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #e74c3c;
  font-weight: 500;
}

.recording-indicator {
  width: 12px;
  height: 12px;
  background: #e74c3c;
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

.evaluation-result {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.evaluation-result h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
}

.overall-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.score-circle.excellent {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.score-circle.good {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.score-circle.fair {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.score-circle.poor {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.score-value {
  font-size: 36px;
  font-weight: bold;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
}

.overall-advice {
  font-size: 16px;
  color: #2c3e50;
  text-align: center;
  margin: 0;
}

.dimension-scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.dimension-item {
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dimension-name {
  font-weight: 500;
  color: #2c3e50;
}

.dimension-score {
  font-size: 18px;
  font-weight: bold;
  color: #3498db;
}

.dimension-bar {
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.5s ease;
}

.dimension-advice {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
}

.detailed-analysis {
  margin-bottom: 30px;
}

.detailed-analysis h4 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.word-analysis {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.word-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.word-text {
  font-size: 14px;
  color: #2c3e50;
}

.word-score {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
}

.word-score.excellent {
  background: #27ae60;
  color: white;
}

.word-score.good {
  background: #3498db;
  color: white;
}

.word-score.fair {
  background: #f39c12;
  color: white;
}

.word-score.poor {
  background: #e74c3c;
  color: white;
}

.improvement-suggestions {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.improvement-suggestions h4 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.improvement-suggestions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.improvement-suggestions li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  color: #2c3e50;
  line-height: 1.6;
}

.improvement-suggestions li:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #3498db;
  font-weight: bold;
}

.error-message {
  margin-top: 20px;
  padding: 15px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  text-align: center;
}
</style>
