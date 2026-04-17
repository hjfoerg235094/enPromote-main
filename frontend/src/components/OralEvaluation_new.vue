
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

const evaluationConfig = ref({
  category: 'sentence' as const,
  level: 'senior' as const
});

const MAX_RECORD_SECONDS = 30;
const evaluationText = ref('');
const isRecording = ref(false);
const isEvaluating = ref(false);
const recordingTime = ref(0);
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string>('');
const evaluationResult = ref<OralEvaluationResult | null>(null);
const errorMessage = ref('');

let audioContext: AudioContext | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let processor: ScriptProcessorNode | null = null;
let pcmData: Int16Array[] = [];
let recordingTimer: number | null = null;
let mediaStream: MediaStream | null = null;

const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

// ✅ 正确录音：16k 16bit mono PCM 裸数据
const startRecording = async () => {
  try {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
    pcmData = [];
    audioBlob.value = null;
    audioUrl.value = '';
    evaluationResult.value = null;
    errorMessage.value = '';

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext({ sampleRate: 16000 });
    source = audioContext.createMediaStreamSource(mediaStream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const channelData = e.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      pcmData.push(int16Data);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    isRecording.value = true;

    recordingTime.value = 0;
    recordingTimer = window.setInterval(() => {
      recordingTime.value++;
      if (recordingTime.value >= MAX_RECORD_SECONDS) stopRecording();
    }, 1000);
  } catch (err) {
    console.error('录音失败', err);
    errorMessage.value = '麦克风权限异常';
  }
};

const stopRecording = () => {
  if (!isRecording.value) return;

  isRecording.value = false;
  if (recordingTimer) clearInterval(recordingTimer);

  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (source) source.disconnect();
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  if (audioContext) audioContext.close();

  // 合并 PCM
  const totalLen = pcmData.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Int16Array(totalLen);
  let offset = 0;
  for (const arr of pcmData) {
    result.set(arr, offset);
    offset += arr.length;
  }

  const uint8 = new Uint8Array(result.buffer);
  audioBlob.value = new Blob([uint8], { type: 'audio/l16' });
  audioUrl.value = URL.createObjectURL(audioBlob.value);
};

const playRecording = () => {
  if (audioUrl.value) new Audio(audioUrl.value).play();
};

// ✅ 提交评测（上传 PCM）
const submitEvaluation = async () => {
  if (!audioBlob.value) {
    errorMessage.value = '请先录制音频';
    return;
  }

  try {
    isEvaluating.value = true;
    errorMessage.value = '';

    // 直接使用evaluatePronunciation函数，它会自动处理音频格式转换
    const response = await evaluatePronunciation({
      audio: audioBlob.value,
      text: evaluationText.value,
      category: evaluationConfig.value.category,
      level: evaluationConfig.value.level
    });

    // 由于request.ts返回的是完整的response对象，需要访问response.data来获取实际数据
    const data = response.data;
    if (data && data.success && data.data) {
      evaluationResult.value = data.data;
    } else {
      errorMessage.value = data?.message || '评测失败';
    }
  } catch (error) {
    console.error('评测失败', error);
    errorMessage.value = '评测请求失败: ' + (error as Error).message;
  } finally {
    isEvaluating.value = false;
  }
};

const getScoreClass = (score: number) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

const getWordScoreClass = (score: number) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
};

const getImprovementSuggestions = () => {
  if (!evaluationResult.value) return [];
  const suggestions: string[] = [];
  const { dimensions, advice } = evaluationResult.value;

  if (dimensions.accuracy < 80) suggestions.push(advice.accuracy);
  if (dimensions.fluency < 80) suggestions.push(advice.fluency);
  if (dimensions.integrity < 80) suggestions.push(advice.integrity);
  if (dimensions.pronunciation < 80) suggestions.push(advice.pronunciation);
  if (dimensions.speed && dimensions.speed < 80 && advice.speed) suggestions.push(advice.speed);
  if (dimensions.intonation && dimensions.intonation < 80 && advice.intonation) suggestions.push(advice.intonation);

  return suggestions.length ? suggestions : ['发音很棒，继续保持！'];
};

onUnmounted(() => {
  if (recordingTimer) clearInterval(recordingTimer);
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
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
