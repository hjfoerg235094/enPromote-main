 <template>
  <div class="ai-chat-practice">
    <!-- 场景选择模态框 -->
    <div v-if="showSceneModal" class="guide-modal-overlay">
      <div class="guide-modal">
        <div class="guide-header">
          <h2>🎯 选择对话场景</h2>
          <p>选择一个场景开始任务导向的AI对话练习</p>
        </div>
        <div class="scene-options">
          <div v-for="scene in sceneOptions" :key="scene.value" class="scene-card"
            :class="{ active: selectedScene === scene.value }" @click="selectedScene = scene.value">
            <div class="scene-icon">{{ scene.icon }}</div>
            <h3>{{ scene.name }}</h3>
            <p>{{ scene.description }}</p>
            <div class="scene-tasks">
              <span class="tasks-label">主要任务：</span>
              <ul>
                <li v-for="task in scene.tasks" :key="task">{{ task }}</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="guide-actions">
          <button class="btn-primary" :disabled="!selectedScene" @click="startTaskChat">开始对话</button>
        </div>
      </div>
    </div>

    <!-- 聊天界面 -->
    <div v-if="!showSceneModal && sessionId" class="chat-interface">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="ai-info">
          <div class="ai-avatar">{{ getSceneIcon }}</div>
          <div class="ai-details">
            <span class="ai-name">{{ sceneInfo?.aiRole || 'AI助手' }}</span>
            <span class="ai-status">
              <span class="status-dot"></span>
              {{ sceneInfo?.scene || getSceneName }}
            </span>
          </div>
        </div>
        <div class="chat-actions">
          <button class="action-btn" @click="showPracticeWords" title="练习单词">📚</button>
          <button class="action-btn" @click="exitChat" title="退出对话">❌</button>
        </div>
      </div>

      <!-- 当前任务高亮显示区域 -->
      <div class="current-task-banner" v-if="currentTask">
        <div class="task-banner-content">
          <div class="task-icon">🎯</div>
          <div class="task-info">
            <div class="task-title">当前任务: {{ currentTask.name }}</div>
            <div class="task-description">{{ currentTask.description }}</div>
            <div class="task-words-preview">
              <span class="words-label">目标单词:</span>
              <span v-for="word in currentTask.requiredWords.slice(0, 3)" :key="word" 
                    class="word-preview" 
                    :class="{ used: currentTask.usedWords && currentTask.usedWords.includes(word) }">
                {{ word }}
              </span>
              <span v-if="currentTask.requiredWords.length > 3" class="more-words">
                +{{ currentTask.requiredWords.length - 3 }}个
              </span>
            </div>
          </div>
          <div class="task-progress-circle">
            <div class="progress-number">{{ progress.tasksCompleted }}/{{ progress.totalTasks }}</div>
            <div class="progress-label">任务</div>
          </div>
        </div>
        <div class="task-banner-actions">
          <button class="task-detail-btn" @click="showTaskSidebar = true">
            查看详情 📋
          </button>
        </div>
      </div>

      <!-- 备用进度条（当没有当前任务时显示） -->
      <div v-else class="progress-bar">
        <div class="progress-info">
          <span class="progress-text">
            任务进度: {{ progress.tasksCompleted }}/{{ progress.totalTasks }} | 
            单词: {{ progress.wordsUsed }}个 | 
            轮次: {{ progress.turnCount }}
          </span>
        </div>
      </div>

      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">👋</div>
          <h3>欢迎来到AI对话练习！</h3>
          <p>开始你的第一次对话吧，AI老师会帮助你练习英语单词。</p>
        </div>

        <div v-for="message in messages" :key="message.id" class="message-wrapper">
          <div class="message"
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
            <div class="message-avatar">
              {{ message.role === 'user' ? '👤' : '👨‍🏫' }}
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              <div v-if="message.streaming" class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <div class="input-container">
          <div class="input-wrapper">
            <button class="task-btn" @click="showTaskSidebar = !showTaskSidebar" title="学习任务">
              📋
            </button>
            <input v-model="inputMessage" @keyup.enter="sendMessage"
              :placeholder="useEnglish ? 'Type your message in English...' : '请用英文输入你的消息...'" :disabled="loading"
              class="message-input" />
            <button class="send-btn" @click="sendMessage" :disabled="loading || !inputMessage.trim()">
              <span v-if="loading" class="loading-spinner">⏳</span>
              <span v-else class="send-icon">📤</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习单词侧边栏 -->
    <div v-if="showWordsSidebar" class="words-sidebar-overlay" @click="showWordsSidebar = false">
      <div class="words-sidebar" @click.stop>
        <div class="sidebar-header">
          <h3>📚 练习单词</h3>
          <button class="close-btn" @click="showWordsSidebar = false">✕</button>
        </div>
        <div class="words-list">
          <div v-for="word in practiceWords" :key="word.id" class="word-item">
            <div class="word-main">
              <span class="word-text">{{ word.word }}</span>
              <span class="word-phonetic">{{ word.phonetic }}</span>
            </div>
            <div class="word-meaning">{{ word.chineseMeaning }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务进度侧边栏 -->
    <div v-if="showTaskSidebar" class="task-sidebar-overlay" @click="showTaskSidebar = false">
      <div class="task-sidebar" @click.stop>
        <div class="sidebar-header">
          <h3>📋 任务详情</h3>
          <button class="close-btn" @click="showTaskSidebar = false">✕</button>
        </div>
        
        <!-- 进度统计 -->
        <div class="progress-stats">
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <span class="stat-number">{{ progress.tasksCompleted }}/{{ progress.totalTasks }}</span>
              <span class="stat-label">已完成任务</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-info">
              <span class="stat-number">{{ progress.wordsUsed }}</span>
              <span class="stat-label">已使用单词</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-info">
              <span class="stat-number">{{ progress.turnCount }}</span>
              <span class="stat-label">对话轮次</span>
            </div>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="tasks-container">
          <h4 class="tasks-title">任务清单</h4>
          <div class="tasks-list">
            <div v-for="task in tasks" :key="task.id" class="task-item"
              :class="{ completed: task.completed, current: !task.completed && isCurrentTask(task) }">
              <div class="task-status">
                <span v-if="task.completed" class="status-icon completed">✅</span>
                <span v-else-if="isCurrentTask(task)" class="status-icon current">🔄</span>
                <span v-else class="status-icon pending">⏳</span>
              </div>
              <div class="task-content">
                <h5>{{ task.name }}</h5>
                <p>{{ task.description }}</p>
                <div class="task-words">
                  <span class="words-label">目标单词：</span>
                  <div class="word-tags">
                    <span v-for="word in task.requiredWords" :key="word" class="word-tag"
                      :class="{ used: task.usedWords && task.usedWords.includes(word) }">
                      {{ word }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'

// Props
const props = defineProps({
  chapter: {
    type: String,
    default: 'A'
  }
})

// Emits
const emit = defineEmits(['complete', 'exit'])

// 响应式数据
const showSceneModal = ref(false) // 不再显示场景选择模态框
const selectedScene = ref('')
const sessionId = ref('')
const sceneInfo = ref({})

const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesContainer = ref(null)

// 任务相关数据
const tasks = ref([])
const progress = ref({
  tasksCompleted: 0,
  totalTasks: 0,
  wordsUsed: 0,
  turnCount: 0
})
const showTaskProgress = ref(false)
const completionReport = ref(null)

const showWordsSidebar = ref(false)
const showTaskSidebar = ref(false)
const practiceWords = ref([])

// 添加缺失的useEnglish变量
const useEnglish = ref(true) // 默认使用英文

// 场景选项配置
const sceneOptions = ref([
  {
    value: 'A',
    name: '酒店入住',
    icon: '🏨',
    description: '模拟酒店前台办理入住手续的完整流程',
    tasks: ['确认预订信息', '检查身份证件', '介绍房间设施', '说明酒店政策', '完成入住登记']
  },
  {
    value: 'B',
    name: '餐厅用餐',
    icon: '🍽️',
    description: '模拟在餐厅用餐的完整服务流程',
    tasks: ['欢迎客人', '介绍菜单', '记录点餐', '询问特殊需求', '服务和结账']
  }
])

// 计算属性
const isCurrentTask = computed(() => {
  return (task) => {
    const incompleteTasks = tasks.value.filter(t => !t.completed)
    return incompleteTasks.length > 0 && incompleteTasks[0].id === task.id
  }
})

// 当前任务
const currentTask = computed(() => {
  const incompleteTasks = tasks.value.filter(t => !t.completed)
  return incompleteTasks.length > 0 ? incompleteTasks[0] : null
})

// 根据章节获取场景图标
const getSceneIcon = computed(() => {
  const iconMap = {
    'A': '🏨', // 酒店场景
    'B': '🍽️'  // 餐厅场景
  }
  return iconMap[props.chapter] || '🤖'
})

// 根据章节获取场景名称
const getSceneName = computed(() => {
  const nameMap = {
    'A': '酒店场景',
    'B': '餐厅场景'
  }
  return nameMap[props.chapter] || '对话练习'
})

// 加载历史对话
const loadChatHistory = async (sessionId) => {
  try {
    const response = await fetch(`/api/aiApi/getChatHistory?sessionId=${sessionId}`)
    const data = await response.json()
    
    if (data.code === 200) {
      const { messages: historyMessages, sessionInfo } = data.data
      
      // 恢复会话信息
      sceneInfo.value = {
        scene: sessionInfo.scene,
        aiRole: sessionInfo.chapter === 'A' ? '酒店前台接待员' : '餐厅服务员'
      }
      tasks.value = sessionInfo.tasks || []
      progress.value = sessionInfo.progress || { tasksCompleted: 0, totalTasks: 0, wordsUsed: 0, turnCount: 0 }
      
      // 恢复历史消息
      messages.value = historyMessages.map((msg, index) => ({
        id: Date.now() + index,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      
      console.log(`加载了 ${historyMessages.length} 条历史消息`)
      scrollToBottom()
      return true
    }
    return false
  } catch (error) {
    console.error('加载历史对话失败:', error)
    return false
  }
}

// 开始任务对话
const startTaskChat = async () => {
  try {
    const response = await fetch('/api/aiApi/startTaskChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapter: props.chapter // 明确传递章节参数
      })
    })

    const data = await response.json()
    if (data.code === 200) {
      sessionId.value = data.data.sessionId
      sceneInfo.value = data.data.sceneInfo
      tasks.value = data.data.tasks
      progress.value = data.data.progress

      // 检查是否有历史对话
      const hasHistory = await loadChatHistory(sessionId.value)
      
      if (!hasHistory) {
        // 没有历史对话，添加欢迎消息
        const welcomeMsg = data.data.welcomeMessage || `欢迎来到${getSceneName.value}！让我们开始对话练习吧！`
        const welcomeMsgObj = {
          id: Date.now(),
          role: 'assistant',
          content: welcomeMsg,
          timestamp: new Date()
        }
        messages.value.push(welcomeMsgObj)
        
        // 保存欢迎消息到数据库
        await saveChatMessage('assistant', welcomeMsg)
      }

      showSceneModal.value = false
    } else {
      console.error('创建会话失败:', data.message)
    }
  } catch (error) {
    console.error('创建会话失败:', error)
  }
}

// 保存消息到数据库
const saveChatMessage = async (role, content) => {
  try {
    await fetch('/api/aiApi/saveChatMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        role,
        content
      })
    })
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

// 发送任务导向消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value || !sessionId.value) return

  const userMessage = inputMessage.value.trim()

  // 添加用户消息
  const userMsg = {
    id: Date.now(),
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  }
  messages.value.push(userMsg)

  // 用户消息会在后端taskChat中自动保存，这里不需要重复保存
  // await saveChatMessage('user', userMessage)

  // 添加AI消息占位符
  const aiMessageId = Date.now() + 1
  messages.value.push({
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    streaming: true
  })

  inputMessage.value = ''
  loading.value = true

  try {
    // 使用fetch处理SSE流式响应
    const response = await fetch('/api/aiApi/taskChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        message: userMessage
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' // 用于累积不完整的数据

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 将新数据添加到缓冲区
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 调试：显示接收到的原始数据
      if (chunk.trim()) {
        console.log('🔄 接收到数据块:', JSON.stringify(chunk))
      }

      // 按行分割，保留最后一个可能不完整的行
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保存最后一个可能不完整的行

      // 调试：显示处理的行数
      if (lines.length > 0) {
        console.log('📋 处理行数:', lines.length, '缓冲区剩余:', JSON.stringify(buffer))
      }

      // 处理完整的行
      let currentEvent = null

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
          console.log('🎯 检测到事件:', currentEvent)
        } else if (line.startsWith('data: ') && currentEvent) {
          const data = line.slice(6).trim()
          console.log('📦 处理数据:', currentEvent, '→', JSON.stringify(data))

          if (currentEvent === 'delta') {
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                // 更新AI消息内容
                const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
                if (aiMessage) {
                  console.log('📝 接收到内容片段:', JSON.stringify(parsed.content))
                  aiMessage.content += parsed.content
                  scrollToBottom()
                }
              }
            } catch (e) {
              console.error('解析delta数据失败:', e, 'data:', data)
            }
          } else if (currentEvent === 'progress') {
            try {
              const parsed = JSON.parse(data)
              if (parsed.progress) {
                progress.value = parsed.progress
              }
              if (parsed.currentTask) {
                // 更新任务状态
                const taskIndex = tasks.value.findIndex(t => t.id === parsed.currentTask.id)
                if (taskIndex !== -1) {
                  tasks.value[taskIndex] = parsed.currentTask
                }
              }
            } catch (e) {
              console.error('解析进度数据失败:', e)
            }
          } else if (currentEvent === 'completion') {
            try {
              const parsed = JSON.parse(data)
              if (parsed.completed) {
                console.log('🎉 任务真正完成!')
                completionReport.value = parsed.report
                // 触发真正的任务完成事件
                emit('complete', {
                  completedTasks: tasks.value.filter(t => t.completed).length,
                  totalTasks: tasks.value.length,
                  progress: progress.value,
                  isRealCompletion: true, // 标记这是真正的任务完成
                  report: parsed.report
                })
                showCompletionModal()
              }
            } catch (e) {
              console.error('解析完成数据失败:', e)
            }
          } else if (currentEvent === 'end' && data === '[DONE]') {
            // 流结束
            const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
            if (aiMessage) {
              aiMessage.streaming = false
              // AI消息会在后端taskChat中自动保存，这里不需要重复保存
              // await saveChatMessage('assistant', aiMessage.content)
            }
            break
          }

          // 重置事件，准备处理下一个事件
          currentEvent = null
        } else if (line === '') {
          // 空行，重置事件状态
          currentEvent = null
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer.trim()) {
      console.log('处理剩余缓冲区数据:', buffer)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    // 移除失败的消息
    messages.value = messages.value.filter(msg => msg.id !== aiMessageId)
  } finally {
    loading.value = false
  }
}

// 显示完成模态框
const showCompletionModal = () => {
  // 这里可以显示任务完成的模态框
  alert(`恭喜完成任务！\n${completionReport.value.feedback}`)
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 显示练习单词
const showPracticeWords = async () => {
  try {
    const response = await fetch('/api/aiApi/practice_words')
    const data = await response.json()
    if (data.code === 200) {
      practiceWords.value = data.data.words || []
      showWordsSidebar.value = true
    }
  } catch (error) {
    console.error('获取练习单词失败:', error)
  }
}

// 退出对话
const exitChat = () => {
  // 发送退出事件，而不是完成事件
  emit('exit', {
    messageCount: messages.value.length,
    userMessages: messages.value.filter(msg => msg.role === 'user').length,
    aiMessages: messages.value.filter(msg => msg.role === 'assistant').length,
    completed: false // 标记为未完成
  })
}

// 任务真正完成时调用
const completeTask = (completionData) => {
  emit('complete', {
    messageCount: messages.value.length,
    userMessages: messages.value.filter(msg => msg.role === 'user').length,
    aiMessages: messages.value.filter(msg => msg.role === 'assistant').length,
    completed: true, // 标记为已完成
    ...completionData
  })
}

// 生命周期
onMounted(() => {
  // 根据章节自动选择场景并开始对话
  selectedScene.value = props.chapter
  startTaskChat()
})
</script>

<style scoped>
.ai-chat-practice {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 指引模态框样式 */
.guide-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.guide-modal {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.guide-header {
  text-align: center;
  margin-bottom: 2rem;
}

.guide-header h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.guide-header p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.personality-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.personality-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.personality-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.personality-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.personality-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.personality-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.personality-card p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.language-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.language-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.language-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.language-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.language-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.language-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.language-card p {
  margin-bottom: 1rem;
  opacity: 0.8;
}

.language-example {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.language-card:not(.active) .language-example {
  background: #f8f9fa;
}

.example-label {
  font-weight: bold;
  margin-right: 0.5rem;
}

.guide-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e9ecef;
}

/* 聊天界面样式 */
.chat-interface {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ai-avatar {
  font-size: 2rem;
}

.ai-details {
  display: flex;
  flex-direction: column;
}

.ai-name {
  font-weight: bold;
  color: #333;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
}

.chat-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.action-btn:hover {
  background: #f0f0f0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  min-height: 0; /* 确保flex子项可以收缩 */
}

.welcome-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.welcome-message h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.message-wrapper {
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.3s ease-out;
  display: flex;
  width: 100%;
}

.message-wrapper:has(.user-message) {
  justify-content: flex-end;
}

.message-wrapper:has(.ai-message) {
  justify-content: flex-start;
}

/* 兼容不支持:has()的浏览器 */
.message-wrapper .user-message {
  margin-left: auto;
}

.message-wrapper .ai-message {
  margin-right: auto;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message {
  display: flex;
  gap: 1rem;
  max-width: 85%;
  margin-bottom: 1rem;
}

.user-message {
  margin-left: auto;
  margin-right: 0;
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.ai-message {
  margin-left: 0;
  margin-right: auto;
  flex-direction: row;
  justify-content: flex-start;
}

.user-message .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  margin-left: 0;
  margin-right: 0.5rem;
}

.ai-message .message-content {
  background: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-left: 0.5rem;
  margin-right: 0;
}

.message-avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.message-content {
  padding: 1rem;
  border-radius: 12px;
  position: relative;
}

.message-text {
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.6;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-top: 0.5rem;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {

  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }

  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input {
  padding: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-container {
  max-width: 900px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: white;
  border-radius: 30px;
  padding: 0.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.input-wrapper:focus-within {
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
}

.message-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
  color: #333;
}

.message-input::placeholder {
  color: #999;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.task-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.task-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.task-btn:active {
  transform: translateY(0);
}

.send-icon {
  font-size: 1.2rem;
}

.loading-spinner {
  font-size: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 练习单词侧边栏 */
.words-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.words-sidebar {
  width: 350px;
  background: white;
  height: 100vh;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 场景选择样式 */
.scene-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.scene-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.scene-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.scene-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.scene-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.scene-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  text-align: center;
}

.scene-card p {
  margin-bottom: 1rem;
  opacity: 0.8;
  text-align: center;
}

.scene-tasks {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.scene-card:not(.active) .scene-tasks {
  background: #f8f9fa;
}

.tasks-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: block;
}

.scene-tasks ul {
  margin: 0;
  padding-left: 1.2rem;
}

.scene-tasks li {
  margin-bottom: 0.3rem;
}

/* 当前任务横幅样式 */
.current-task-banner {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
  animation: taskPulse 2s ease-in-out infinite;
}

@keyframes taskPulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2); }
  50% { box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4); }
}

.task-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.task-icon {
  font-size: 2rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.task-description {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.task-words-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.words-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.word-preview {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.word-preview.used {
  background: rgba(76, 175, 80, 0.8);
  border-color: #4CAF50;
  font-weight: bold;
  transform: scale(1.05);
}

.more-words {
  font-size: 0.8rem;
  opacity: 0.7;
  font-style: italic;
}

.task-progress-circle {
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.progress-number {
  font-size: 1rem;
  font-weight: bold;
  line-height: 1;
}

.progress-label {
  font-size: 0.7rem;
  opacity: 0.8;
}

.task-banner-actions {
  display: flex;
  justify-content: center;
}

.task-detail-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.task-detail-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 简化进度条样式 */
.progress-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.8rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 500;
}

/* 任务侧边栏样式 */
.task-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-start;
}

.task-sidebar {
  width: 400px;
  background: white;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.progress-stats {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card:last-child {
  margin-bottom: 0;
}

.stat-icon {
  font-size: 1.8rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.4rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.2rem;
}

.tasks-container {
  padding: 1.5rem;
}

.tasks-title {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.tasks-list {
  max-height: none;
}

.task-item {
  display: flex;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.task-item.completed {
  background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%);
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.task-item.current {
  background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%);
  border-color: #ffc107;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
}

.task-item:not(.completed):not(.current) {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.task-status {
  flex-shrink: 0;
}

.status-icon {
  font-size: 1.3rem;
}

.task-content h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.task-content p {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.task-words {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.words-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.word-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.word-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.3rem 0.6rem;
  border-radius: 16px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.word-tag.used {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  font-weight: 600;
  border-color: #4CAF50;
  box-shadow: 0 1px 3px rgba(76, 175, 80, 0.2);
}

.words-list {
  padding: 1rem;
}

.word-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.word-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.word-text {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.word-phonetic {
  color: #667eea;
  font-style: italic;
}

.word-meaning {
  color: #666;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-modal {
    width: 95%;
    padding: 1.5rem;
  }

  .personality-options {
    grid-template-columns: 1fr;
  }

  .language-options {
    grid-template-columns: 1fr;
  }

  .words-sidebar, .task-sidebar {
    width: 100%;
  }

  .message {
    max-width: 95%;
  }

  .chat-header {
    padding: 1rem;
  }

  .ai-info {
    gap: 0.8rem;
  }

  .ai-avatar {
    font-size: 1.5rem;
  }

  .chat-actions {
    gap: 0.3rem;
  }

  .action-btn {
    font-size: 1rem;
    padding: 0.4rem;
  }

  .progress-bar {
    padding: 0.6rem 1rem;
  }

  .progress-text {
    font-size: 0.8rem;
  }

  .messages-container {
    padding: 1rem;
  }

  .message-avatar {
    width: 35px;
    height: 35px;
    font-size: 1.2rem;
  }

  .message-content {
    padding: 0.8rem;
  }

  .chat-input {
    padding: 1rem;
  }

  .input-wrapper {
    padding: 0.3rem;
  }

  .message-input {
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
  }

  .send-btn {
    width: 45px;
    height: 45px;
  }

  .task-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .stat-card {
    padding: 0.8rem;
    gap: 0.8rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .stat-number {
    font-size: 1.2rem;
  }

  .tasks-container {
    padding: 1rem;
  }

  .task-item {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .progress-text {
    font-size: 0.7rem;
  }

  .message {
    max-width: 98%;
  }

  .message-content {
    padding: 0.6rem;
  }

  .input-wrapper {
    gap: 0.5rem;
  }

  .send-btn {
    width: 40px;
    height: 40px;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1rem 0.5rem;
  }

  .task-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .task-status {
    align-self: flex-start;
  }
}
</style>
