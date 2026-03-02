<template>
  <div class="dialogue-task">
    <div class="task-header">
      <h2>{{ task.name }}</h2>
      <p class="description">{{ task.description }}</p>
    </div>

    <div class="task-content">
      <!-- 目标单词提示 -->
      <div class="target-words">
        <h3>目标单词</h3>
        <div class="words-list">
          <span
            v-for="word in task.requiredWords"
            :key="word"
            class="word-tag"
            :class="{ used: usedWords.includes(word) }"
          >
            {{ word }}
          </span>
        </div>
      </div>

      <!-- 对话区域 -->
      <div class="dialogue-area">
        <div class="messages" ref="messagesRef">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message"
            :class="message.role"
          >
            <div class="message-content">
              {{ message.content }}
            </div>
          </div>
        </div>

        <div class="input-area">
          <textarea
            v-model="userInput"
            placeholder="输入你的回复..."
            @keydown.enter.prevent="sendMessage"
            rows="3"
          ></textarea>
          <button @click="sendMessage" :disabled="!userInput.trim()">
            发送
          </button>
        </div>
      </div>

      <!-- 进度提示 -->
      <div class="progress-info">
        <p>对话轮次: {{ messages.filter(m => m.role === 'user').length }} / {{ task.completionCriteria?.minTurns || 4 }}</p>
        <p>已使用单词: {{ usedWords.length }} / {{ task.minWords || 3 }}</p>
        <p v-if="consecutiveIrrelevantCount > 0" class="warning">连续无关回答: {{ consecutiveIrrelevantCount }}/3</p>
      </div>

      <!-- 对话失败提示 -->
      <div v-if="dialogueFailed" class="dialogue-failed">
        <p>对话已失败！您的回答与当前情景和身份不符。</p>
      </div>

      <!-- 完成按钮 -->
      <div class="task-actions">
        <button
          class="complete-btn"
          @click="completeTask"
          :disabled="!canComplete || dialogueFailed"
        >
          完成任务
        </button>
        <button class="cancel-btn" @click="$emit('cancel')">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';

const props = defineProps<{
  task: any;
  storyId?: string;
  chapterId?: number;
  aiRole?: string;
}>();

const emit = defineEmits(['complete', 'cancel']);

// 根据AI角色生成开场白
function generateOpeningMessage(aiRole: string): string {
  const roleLower = aiRole?.toLowerCase() || '';

  // 根据不同角色生成不同的开场白
  if (roleLower.includes('海关') || roleLower.includes('customs') || roleLower.includes('officer')) {
    return 'May I see your passport and visa, please? What is the purpose of your visit?';
  } else if (roleLower.includes('酒店') || roleLower.includes('reception') || roleLower.includes('front desk')) {
    return 'Welcome! Do you have a reservation? Please provide your booking information.';
  } else if (roleLower.includes('情报') || roleLower.includes('agent') || roleLower.includes('intelligence')) {
    return '(lowering voice) You\'re here. Is the code correct? Confirm your identity.';
  } else if (roleLower.includes('跟踪') || roleLower.includes('follower') || roleLower.includes('suspicious')) {
    return '(looking at you warily) What are you looking at? Why are you following me?';
  } else if (roleLower.includes('前台') || roleLower.includes('staff')) {
    return 'Hello! How may I assist you today?';
  } else if (roleLower.includes('分析') || roleLower.includes('analyst') || roleLower.includes('expert')) {
    return 'Let me examine this data. We need to analyze it carefully.';
  } else {
    // 默认开场白
    return 'Hello! We can start our conversation now.';
  }
}

const messages = ref<any[]>([
  {
    role: 'assistant',
    content: generateOpeningMessage(props.aiRole || '')
  }
]);
const userInput = ref('');
const messagesRef = ref<HTMLElement>();
const isLoading = ref(false);
const openingMessage = ref('');
const consecutiveIrrelevantCount = ref(0); // 连续无关回答的计数
const dialogueFailed = ref(false); // 对话是否失败

// 检查用户回答是否与身份和情景相关
async function checkRelevance(message: string): Promise<boolean> {
  console.log('检查相关性:', message);
  // 直接使用简单相关性检查，不再依赖后端API
  return simpleRelevanceCheck(message);
}

// 简单的相关性检查作为后备方案
function simpleRelevanceCheck(message: string): boolean {
  // 获取任务相关的关键词
  const keywords = [
    ...(props.task.requiredWords || []),
    props.task.userRole || '',
    props.aiRole || '',
    props.task.scene || ''
  ].filter(k => k.trim());
  
  const lowerMessage = message.toLowerCase();
  
  // 如果消息太短（少于5个单词），认为可能无关
  const words = lowerMessage.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) {
    console.log('消息太短，认为可能无关');
    return false;
  }
  
  // 检查消息中是否包含任何关键词
  const hasKeyword = keywords.some(keyword => 
    keyword && lowerMessage.includes(keyword.toLowerCase())
  );
  
  console.log('简单相关性检查结果:', hasKeyword, '关键词:', keywords);
  return hasKeyword;
}

const usedWords = computed(() => {
  const userMessages = messages.value.filter(m => m.role === 'user');
  const allText = userMessages.map(m => m.content).join(' ').toLowerCase();
  const words = props.task.requiredWords || [];
  return words.filter((word: string) => allText.includes(word.toLowerCase()));

});

const canComplete = computed(() => {
  const minTurns = props.task.completionCriteria?.minTurns || 4;
  const minWords = props.task.minWords || 3;
  // 只计算用户的回答次数
  const userMessageCount = messages.value.filter(m => m.role === 'user').length;
  return userMessageCount >= minTurns && usedWords.value.length >= minWords;
});

async function sendMessage() {
  if (!userInput.value.trim() || isLoading.value || dialogueFailed.value) return;

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userInput.value
  });

  const userMessage = userInput.value;
  userInput.value = '';
  isLoading.value = true;

  // 检查用户回答是否与身份和情景相关
  const isRelevant = await checkRelevance(userMessage);
  
  if (isRelevant) {
    // 回答相关，重置计数器
    consecutiveIrrelevantCount.value = 0;
  } else {
    // 回答无关，增加计数器
    consecutiveIrrelevantCount.value++;
    
    // 如果连续三次无关回答，判定对话失败
    if (consecutiveIrrelevantCount.value >= 3) {
      dialogueFailed.value = true;
      messages.value.push({
        role: 'assistant',
        content: '很抱歉，您的回答与当前情景和身份不符，对话已失败。请重新开始任务。'
      });
      isLoading.value = false;
      return;
    }
  }

  // 滚动到底部
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }

  try {
    // 调用AI对话API
    const response = await fetch(
      `/api/story/${props.storyId}/chapter/${props.chapterId}/task/${props.task.id}/dialogue`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.value
        })
      }
    );

    if (!response.ok) {
      throw new Error('AI对话失败');
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let aiResponse = '';

    // 添加一个空的AI消息占位符
    messages.value.push({
      role: 'assistant',
      content: ''
    });

    // 获取最后一条消息的引用，避免每次都查找
    const lastMessageIndex = messages.value.length - 1;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                aiResponse += parsed.content;
                // 直接更新最后一条消息的内容
                messages.value[lastMessageIndex].content = aiResponse;

                // 使用requestAnimationFrame优化滚动性能
                requestAnimationFrame(() => {
                  if (messagesRef.value) {
                    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
                  }
                });
              }
            } catch (e) {
              console.error('解析响应失败:', e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('AI对话错误:', error);
    messages.value.push({
      role: 'assistant',
      content: '抱歉,我遇到了一些问题。请稍后再试。'
    });
  } finally {
    isLoading.value = false;

    // 滚动到底部
    await nextTick();
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  }
}

async function completeTask() {
  if (!canComplete.value) return;

  const userMessages = messages.value.filter(m => m.role === 'user');
  const userMessageCount = userMessages.length;

  try {
    // 调用AI反馈API
    const response = await fetch(
      `/api/story/${props.storyId}/chapter/${props.chapterId}/task/${props.task.id}/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: calculateScore(),
          userPerformance: {
            wordsUsed: usedWords.value,
            turns: userMessageCount,
            messages: userMessages.map(m => m.content)
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('获取AI反馈失败');
    }

    const data = await response.json();

    emit('complete', {
      wordsUsed: usedWords.value,
      turns: userMessageCount,
      qualityScore: data.data?.customFeedback ? 30 : 30,
      feedback: data.data,
      messages: userMessages.map(m => m.content)
    });
  } catch (error) {
    console.error('获取AI反馈失败:', error);
    // 即使失败也允许完成任务
    emit('complete', {
      wordsUsed: usedWords.value,
      turns: userMessageCount,
      qualityScore: 30,
      messages: userMessages.map(m => m.content)
    });
  }
}

function calculateScore(): number {
  const minWords = props.task.minWords || 3;
  const minTurns = props.task.completionCriteria?.minTurns || 4;
  
  // 计算用户的回答次数
  const userMessageCount = messages.value.filter(m => m.role === 'user').length;

  // 单词得分 (40分满分) - 限制不超过40分
  const wordScore = Math.min((usedWords.value.length / minWords) * 40, 40);
  // 对话轮次得分 (30分满分) - 限制不超过30分，只计算用户的回答次数
  const turnScore = Math.min((userMessageCount / minTurns) * 30, 30);
  // 表达质量得分 (30分满分)
  const qualityScore = 30; // 基础分

  return Math.round(wordScore + turnScore + qualityScore);
}
</script>

<style scoped>
.dialogue-task {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-header {
  margin-bottom: 20px;
}

.task-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.task-header .description {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.target-words {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.target-words h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.word-tag {
  padding: 4px 12px;
  background: #e0e0e0;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.word-tag.used {
  background: #67c23a;
  color: white;
}

.dialogue-area {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.messages {
  height: 300px;
  overflow-y: auto;
  padding: 15px;
  background: #fafafa;
}

.message {
  margin-bottom: 12px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 8px;
  line-height: 1.5;
}

.message.user .message-content {
  background: #409eff;
  color: white;
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.input-area {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-area textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  resize: none;
  font-size: 14px;
}

.input-area button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.input-area button:hover:not(:disabled) {
  background: #66b1ff;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.progress-info .warning {
  color: #e6a23c;
  font-weight: bold;
}

.dialogue-failed {
  padding: 15px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  margin-bottom: 20px;
}

.dialogue-failed p {
  margin: 0;
  color: #f56c6c;
  font-size: 14px;
  font-weight: bold;
}

.task-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.complete-btn {
  padding: 10px 24px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.complete-btn:hover:not(:disabled) {
  background: #85ce61;
}

.complete-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 10px 24px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.cancel-btn:hover {
  background: #f78989;
}
</style>
