<template>
  <div class="oral-practice" v-if="text">
    <div class="practice-header">
      <span class="practice-title">发音练习 - {{ text }}</span>
      <span class="score" v-if="evaluationResult" :class="{ good: evaluationResult.overallScore >= 80, average: evaluationResult.overallScore >= 60 && evaluationResult.overallScore < 80, poor: evaluationResult.overallScore < 60 }">
        {{ evaluationResult.overallScore }}分
      </span>
    </div>

    <div class="practice-controls">
      <button 
        @click="toggleRecording" 
        :class="['record-btn', { recording: isRecording }]"
        :disabled="isEvaluating"
      >
        <span v-if="!isRecording">🎤 开始录音</span>
        <span v-else>⏹️ 停止录音</span>
      </button>

      <button 
        @click="playRecording" 
        class="play-btn"
        :disabled="!audioUrl || isRecording || isEvaluating"
      >
        🔊 播放
      </button>

      <button 
        @click="submitEvaluation" 
        class="evaluate-btn"
        :disabled="!audioBlob || isEvaluating"
      >
        <span v-if="!isEvaluating">✨ 提交评测</span>
        <span v-else>评测中...</span>
      </button>
    </div>

    <div class="evaluation-result" v-if="evaluationResult">
      <div class="result-item">
        <span class="label">准确度:</span>
        <div class="score-bar">
          <div class="score-fill" :style="{ width: evaluationResult.dimensions.accuracy + '%' }" :class="getScoreClass(evaluationResult.dimensions.accuracy)"></div>
        </div>
        <span class="score-text">{{ evaluationResult.dimensions.accuracy }}%</span>
      </div>
      <div class="result-item">
        <span class="label">流利度:</span>
        <div class="score-bar">
          <div class="score-fill" :style="{ width: evaluationResult.dimensions.fluency + '%' }" :class="getScoreClass(evaluationResult.dimensions.fluency)"></div>
        </div>
        <span class="score-text">{{ evaluationResult.dimensions.fluency }}%</span>
      </div>
      <div class="result-item">
        <span class="label">完整度:</span>
        <div class="score-bar">
          <div class="score-fill" :style="{ width: evaluationResult.dimensions.integrity + '%' }" :class="getScoreClass(evaluationResult.dimensions.integrity)"></div>
        </div>
        <span class="score-text">{{ evaluationResult.dimensions.integrity }}%</span>
      </div>
    </div>

    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { evaluatePronunciation, type OralEvaluationResult } from '../api/oral';

const props = withDefaults(defineProps<{
  text?: string;
  category?: 'word' | 'sentence' | 'paragraph' | 'free';
}>(), {
  text: '',
  category: 'word'
});

// 录音状态
const isRecording = ref(false);
const isEvaluating = ref(false);
const recordingTime = ref(0);
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string>('');
const evaluationResult = ref<OralEvaluationResult | null>(null);
const errorMessage = ref('');

// 限制最长录音时长，避免超出后端上传限制
const MAX_RECORD_SECONDS = 30;

// 录音相关变量
let mediaRecorder: MediaRecorder | null = null;
let recordingTimer: number | null = null;
let audioChunks: BlobPart[] = [];

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

    // 开始计时（到点自动停止）
    recordingTime.value = 0;
    recordingTimer = window.setInterval(() => {
      recordingTime.value++;
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
      audio: new File([audioBlob.value], 'recording.wav', { type: 'audio/wav' }),
      text: props.text,
      category: props.category || 'word',
      level: 'primary'
    });

    if (response.data.success && response.data.data) {
      evaluationResult.value = response.data.data;
    } else {
      errorMessage.value = response.data.message || '评测失败，请重试';
    }

  } catch (error) {
    console.error('评测失败:', error);
    errorMessage.value = '评测失败，请重试';
  } finally {
    isEvaluating.value = false;
  }
};

// 获取分数对应的样式类
const getScoreClass = (score: number) => {
  if (score >= 80) return 'good';
  if (score >= 60) return 'average';
  return 'poor';
};

// 重置评测状态
const resetEvaluation = () => {
  // 清理之前的录音
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = '';
  }
  audioBlob.value = null;
  audioChunks = [];
  evaluationResult.value = null;
  errorMessage.value = '';
  isEvaluating.value = false;

  // 停止录音
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
  }

  // 停止计时
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
  recordingTime.value = 0;
};

// 暴露重置方法给父组件
defineExpose({
  resetEvaluation
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
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
.oral-practice {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0 0 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.practice-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.score {
  font-size: 16px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
}

.score.good {
  background: #4CAF50;
  color: white;
}

.score.average {
  background: #FF9800;
  color: white;
}

.score.poor {
  background: #f44336;
  color: white;
}

.practice-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.practice-controls button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.record-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.record-btn.recording {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.play-btn {
  background: #e0e0e0;
  color: #333;
}

.play-btn:hover:not(:disabled) {
  background: #d0d0d0;
}

.evaluate-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.practice-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.evaluation-result {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 12px;
  color: #666;
  min-width: 50px;
}

.score-bar {
  flex: 1;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.score-fill {
  height: 100%;
  transition: width 0.5s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.score-fill.good {
  background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
}

.score-fill.average {
  background: linear-gradient(90deg, #FF9800 0%, #F57C00 100%);
}

.score-fill.poor {
  background: linear-gradient(90deg, #f44336 0%, #d32f2f 100%);
}

.score-text {
  font-size: 12px;
  color: #333;
  min-width: 35px;
  text-align: right;
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: #ffebee;
  border-left: 3px solid #f44336;
  border-radius: 4px;
  font-size: 12px;
  color: #f44336;
}
</style>
