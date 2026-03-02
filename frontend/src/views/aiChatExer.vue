<template>
    <div class="ai-chat-container">
        <!-- AI角色选择指引模态框 -->
        <div v-if="showGuideModal" class="guide-modal-overlay">
            <div class="guide-modal">
                <div v-if="guideStep === 1" class="guide-step">
                    <div class="guide-header">
                        <h2>ai 解说</h2>
                        <p>本ai旨在将需要练习的单词融合进正常对话中帮助用户更好地理解单词,那么开始你的第一次对话吧,AI老师会帮助你提升英语水平.</p>
                        <p style="color: blue;">ai会使用的单词可在左侧栏打开</p>

                    </div>
                    <div class="guide-actions">
                        <button class="btn-primary" :disabled="!selectedCharacter" @click="nextStep">
                            下一步
                        </button>
                    </div>
                </div>
                <!-- 步骤1: 选择AI角色 -->
                <div v-if="guideStep === 2" class="guide-step">
                    <div class="guide-header">
                        <h2>🎭 选择你的AI老师角色</h2>
                        <p>选择一个适合你的AI老师角色来开始英语对话练习</p>
                    </div>
                    <div class="role-options">
                        <div class="role-card" :class="{ active: selectedCharacter === 'teacher' }"
                            @click="selectedCharacter = 'teacher'">
                            <div class="role-icon">👨‍🏫</div>
                            <h3>英语老师</h3>
                            <p>专业的英语教学，帮助你提升英语水平</p>
                        </div>
                        <!-- 可以在这里添加更多角色选项 -->
                    </div>
                    <div class="guide-actions">
                        <button class="btn-secondary" @click="prevStep">上一步</button>
                        <button class="btn-primary" :disabled="!selectedCharacter" @click="nextStep">
                            下一步
                        </button>
                    </div>
                </div>

                <!-- 步骤2: 选择AI性格 -->
                <div v-if="guideStep === 3" class="guide-step">
                    <div class="guide-header">
                        <h2>🎨 选择AI老师的性格</h2>
                        <p>选择一种你喜欢的教学风格</p>
                    </div>
                    <div class="personality-options">
                        <div v-for="personality in personalityOptions" :key="personality.value" class="personality-card"
                            :class="{ active: selectedNature === personality.value }"
                            @click="selectedNature = personality.value">
                            <div class="personality-icon">{{ personality.icon }}</div>
                            <h3>{{ personality.name }}</h3>
                            <p>{{ personality.description }}</p>
                        </div>
                    </div>
                    <div class="guide-actions">
                        <button class="btn-secondary" @click="prevStep">上一步</button>
                        <button class="btn-primary" :disabled="!selectedNature" @click="nextStep">
                            下一步
                        </button>
                    </div>
                </div>

                <!-- 步骤3: 选择语言模式 -->
                <div v-if="guideStep === 4" class="guide-step">
                    <div class="guide-header">
                        <h2>🌍 选择对话语言</h2>
                        <p>选择你希望的对话语言模式</p>
                    </div>
                    <div class="language-options">
                        <div class="language-card" :class="{ active: selectedUseEnglish === false }"
                            @click="selectedUseEnglish = false">
                            <div class="language-icon">🇨🇳</div>
                            <h3>中英混合</h3>
                            <p>AI会用中文解释，但会强调英文单词的使用</p>
                            <div class="language-example">
                                <span class="example-label">示例：</span>
                                <span class="example-text">"你刚才用的 'beautiful' 这个词很棒！它比 'good' 更生动..."</span>
                            </div>
                        </div>
                        <div class="language-card" :class="{ active: selectedUseEnglish === true }"
                            @click="selectedUseEnglish = true">
                            <div class="language-icon">🇺🇸</div>
                            <h3>全英文模式</h3>
                            <p>完全使用英文对话，提供沉浸式英语环境</p>
                            <div class="language-example">
                                <span class="example-label">Example：</span>
                                <span class="example-text">"Great use of 'beautiful'! It's much more vivid than
                                    'good'..."</span>
                            </div>
                        </div>
                    </div>
                    <div class="guide-actions">
                        <button class="btn-secondary" @click="prevStep">上一步</button>
                        <button class="btn-primary" :disabled="selectedUseEnglish === null" @click="completeGuide">
                            开始对话
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 简化的顶部信息栏 -->
        <div class="chat-header" v-show="!showGuideModal">
            <div class="ai-info">
                <div class="ai-avatar-display">{{ getAiAvatar() }}</div>
                <div class="ai-details">
                    <span class="ai-name">{{ getAiName() }}</span>
                    <span class="ai-status">
                        <span class="status-dot"></span>
                        在线
                    </span>
                </div>
            </div>

            <button class="settings-btn" @click="showSettingsModal = true" title="AI设置">
                ⚙️
            </button>
        </div>

        <!-- AI设置模态窗口 -->
        <div v-if="showSettingsModal" class="settings-modal-overlay" @click="closeSettingsModal">
            <div class="settings-modal" @click.stop>
                <div class="settings-modal-header">
                    <h3>🤖 AI助手设置</h3>
                    <button class="close-btn" @click="closeSettingsModal">✕</button>
                </div>

                <div class="settings-modal-content">
                    <div class="setting-section">
                        <label class="setting-label">
                            <span class="label-icon">🎭</span>
                            AI角色
                        </label>
                        <select v-model="tempCharacter" class="setting-select">
                            <option value="teacher">👨‍🏫 英语老师</option>
                        </select>
                    </div>

                    <div class="setting-section">
                        <label class="setting-label">
                            <span class="label-icon">🎨</span>
                            AI性格
                        </label>
                        <select v-model="tempNature" class="setting-select">
                            <option value="gentle">😊 彬彬有礼</option>
                            <option value="blunt">🔥 脾气火爆</option>
                            <option value="tsundere">😤 傲娇毒舌</option>
                            <option value="cold">❄️ 超级人机</option>
                            <option value="exaggerated">🎭 夸张幽默</option>
                        </select>
                    </div>

                    <div class="setting-section">
                        <label class="setting-label">
                            <span class="label-icon">🌍</span>
                            对话语言
                        </label>
                        <div class="language-options-modal">
                            <label class="radio-option">
                                <input type="radio" :value="false" v-model="tempUseEnglish" />
                                <span class="radio-label">🇨🇳 中英混合</span>
                                <span class="radio-desc">AI会用中文解释，但会强调英文单词的使用</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" :value="true" v-model="tempUseEnglish" />
                                <span class="radio-label">🇺🇸 全英文模式</span>
                                <span class="radio-desc">完全使用英文对话，提供沉浸式英语环境</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-modal-actions">
                    <button class="btn-cancel" @click="closeSettingsModal">取消</button>
                    <button class="btn-apply" @click="applySettings" :disabled="!hasSettingsChanged">
                        应用设置
                    </button>
                </div>
            </div>
        </div>

        <!-- 确认重置对话模态窗口 -->
        <div v-if="showConfirmModal" class="confirm-modal-overlay">
            <div class="confirm-modal">
                <div class="confirm-header">
                    <span class="confirm-icon">⚠️</span>
                    <h3>确认应用设置</h3>
                </div>
                <div class="confirm-content">
                    <p>应用新的AI设置后会重置当前对话记录，是否继续？</p>
                    <div class="settings-preview">
                        <div class="preview-item">
                            <span class="preview-label">AI角色：</span>
                            <span>{{ getPreviewCharacterName() }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">AI性格：</span>
                            <span>{{ getPreviewNatureName() }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">对话语言：</span>
                            <span>{{ tempUseEnglish ? '🇺🇸 全英文模式' : '🇨🇳 中英混合' }}</span>
                        </div>
                    </div>
                </div>
                <div class="confirm-actions">
                    <button class="btn-cancel" @click="showConfirmModal = false">取消</button>
                    <button class="btn-confirm" @click="confirmApplySettings">确认应用</button>
                </div>
            </div>
        </div>

        <!-- 左侧边栏 -->
        <div class="sidebar" :class="{ 'sidebar-open': showSidebar }">
            <div class="sidebar-header">
                <h3>📚 练习单词</h3>
                <button class="sidebar-close" @click="toggleSidebar">✕</button>
            </div>
            <div class="sidebar-content">
                <div v-if="practiceWords.length === 0" class="no-words">
                    <div class="no-words-icon">📖</div>
                    <p>暂无练习单词</p>
                    <small>开始学习后这里会显示需要练习的单词</small>
                </div>
                <div v-else class="word-list">
                    <div v-for="word in practiceWords" :key="word.id" class="word-item"
                        :class="{ 'word-expanded': expandedWordId === word.id }" @click="toggleWordMeaning(word.id)">
                        <div class="word-header">
                            <div class="word-main">
                                <span class="word-text">{{ word.word }}</span>
                                <span v-if="word.phonetic" class="word-phonetic">{{ word.phonetic }}</span>
                            </div>
                            <div class="word-status">
                                <span class="status-badge" :class="getStatusClass(word.status)">
                                    {{ getStatusText(word.status) }}
                                </span>
                                <span class="expand-icon">{{ expandedWordId === word.id ? '▼' : '▶' }}</span>
                            </div>
                        </div>
                        <div v-if="expandedWordId === word.id" class="word-meaning">
                            <div class="meaning-content">
                                <span class="meaning-label">中文释义：</span>
                                <span class="meaning-text">{{ word.chineseMeaning }}</span>
                            </div>
                            <div class="word-stats">
                                <span class="stat-item">优先级: {{ word.priority }}</span>
                                <span class="stat-item">复习次数: {{ word.reviewCounts }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 侧边栏切换按钮 -->
        <button class="sidebar-toggle" @click="toggleSidebar" :class="{ 'sidebar-toggle-active': showSidebar }">
            <span class="toggle-icon">📚</span>
            <span class="toggle-text">单词列表</span>
        </button>

        <!-- 优化后的聊天区域 -->
        <div class="chat-messages" :class="{ 'chat-with-sidebar': showSidebar }" ref="messagesContainer">
            <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-content">
                    <div class="welcome-icon">💬</div>
                    <h3>欢迎来到AI英语对话练习！</h3>
                    <p>开始你的第一次对话吧，AI老师会帮助你提升英语水平</p>
                    <div class="welcome-tips">
                        <div class="tip-item">
                            <span class="tip-icon">💡</span>
                            <span>AI会根据你的水平调整对话难度</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-icon">📚</span>
                            <span>重点单词会在对话中自然出现</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-icon">🎯</span>
                            <span>每次对话都是学习的机会</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-for="msg in messages" :key="msg.id"
                :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
                <div class="message-avatar">
                    <div v-if="msg.role === 'user'" class="avatar user-avatar">👤</div>
                    <div v-else class="avatar ai-avatar">{{ getAiAvatar() }}</div>
                </div>
                <div class="message-bubble">
                    <div class="message-content">
                        <div class="message-text">{{ msg.content }}</div>
                        <span v-if="msg.streaming" class="typing-indicator">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </span>
                    </div>
                    <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                </div>
            </div>
        </div>

        <!-- 优化后的输入区域 -->
        <div class="chat-input">
            <div class="input-container">
                <div class="input-wrapper">
                    <input v-model="inputMessage" @keyup.enter="sendMessage" @input="validateEnglishInput"
                        @paste="handlePaste"
                        :placeholder="useEnglish ? 'Type your message in English...' : '请用英文输入你的消息...'"
                        :disabled="loading" class="message-input" />
                    <div class="input-actions">
                        <button class="send-btn" @click="sendMessage" :disabled="loading || !inputMessage.trim()">
                            <span v-if="loading" class="loading-spinner">⏳</span>
                            <span v-else class="send-icon">📤</span>
                        </button>
                    </div>
                </div>
                <div v-if="showInputWarning" class="input-warning">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">请只使用英文字符进行练习</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue';
import '@/assets/css/aiChatExer.css'
import { getHistoryMessages, restartConversation, getPracticeWords } from '@/api/ai';
import { getUserInfo, changeInfo } from '@/api/auth';

// 响应式数据
const character = ref('teacher')
const nature = ref('gentle')
const model = ref('review')
const useEnglish = ref(false)
const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesContainer = ref(null)
const showInputWarning = ref(false)

// 指引相关数据
const showGuideModal = ref(false)
const guideStep = ref(1)
const selectedCharacter = ref('')
const selectedNature = ref('')
const selectedUseEnglish = ref(null)

// 设置模态窗口相关数据
const showSettingsModal = ref(false)
const showConfirmModal = ref(false)
const tempCharacter = ref('teacher')
const tempNature = ref('gentle')
const tempUseEnglish = ref(false)

// 侧边栏相关数据
const showSidebar = ref(false)
const practiceWords = ref([])
const expandedWordId = ref(null)

// 性格选项配置
const personalityOptions = ref([
    {
        value: 'gentle',
        name: '彬彬有礼',
        icon: '😊',
        description: '温和耐心，循循善诱的教学风格'
    },
    {
        value: 'blunt',
        name: '脾气火爆',
        icon: '🔥',
        description: '直接犀利，用生动比喻纠正错误'
    },
    {
        value: 'tsundere',
        name: '傲娇毒舌',
        icon: '😤',
        description: '表面严厉内心关怀的教学方式'
    },
    {
        value: 'cold',
        name: '高冷?精英',
        icon: '❄️',
        description: '是人机'
    },
    {
        value: 'exaggerated',
        name: '夸张幽默',
        icon: '🎭',
        description: '生动有趣，用夸张方式加深印象'
    }
])
// 重置
const restart = async () => {
    try {
        const respose = await restartConversation()
        if (respose.data.code == 200) {
            alert('会话已重置')
        }
        messages.value = []
    } catch (err) {
        console.log(err);

    }


}
// 获取历史记录
const getHistory = async () => {
    try {
        const response = await getHistoryMessages()
        messages.value = response.data.data
        console.log(messages.value);

    } catch (err) {
        console.log(err);
    }
}

// 检查用户AI选择状态
const checkAiChooseStatus = async () => {
    try {
        const response = await getUserInfo()
        if (response.data.code === 200) {
            // 如果用户未完成AI选择，显示指引模态框
            if (!response.data.ai_choose_completed) {
                showGuideModal.value = true
                // 设置默认选择
                selectedCharacter.value = 'teacher'
            } else {
                // 如果已完成选择，获取历史记录
                getHistory()
            }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        // 出错时也获取历史记录，保证功能正常
        getHistory()
    }
}

// 指引步骤控制
const nextStep = () => {
    if (guideStep.value < 4) {
        guideStep.value++
    }
}

const prevStep = () => {
    if (guideStep.value > 1) {
        guideStep.value--
    }
}

// 完成指引设置
const completeGuide = async () => {
    try {
        // 设置选择的角色、性格和语言模式
        character.value = selectedCharacter.value
        nature.value = selectedNature.value
        useEnglish.value = selectedUseEnglish.value

        // 更新用户的AI选择完成状态
        const response = await changeInfo({
            ai_choose_completed: true
        })

        if (response.data.code === 200) {
            showGuideModal.value = false
            // 获取历史记录
            getHistory()
        } else {
            console.error('保存AI选择失败:', response.data.message)
            alert('保存失败，请重试')
        }
    } catch (error) {
        console.error('完成AI选择指引失败:', error)
        alert('网络错误，请重试')
    }
}

// 获取AI头像
const getAiAvatar = () => {
    const avatarMap = {
        'teacher': '👨‍🏫'
    }
    return avatarMap[character.value] || '👨‍🏫'
}

// 获取AI名称
const getAiName = () => {
    const nameMap = {
        'teacher': '英语老师'
    }
    const baseName = nameMap[character.value] || '英语老师'

    // 根据性格添加描述
    const personalityMap = {
        'gentle': '温和的',
        'blunt': '直率的',
        'tsundere': '傲娇的',
        'cold': '高冷的',
        'exaggerated': '幽默的'
    }

    const personalityDesc = personalityMap[nature.value] || ''
    return personalityDesc ? `${personalityDesc}${baseName}` : baseName
}

// 设置模态窗口相关方法
const closeSettingsModal = () => {
    showSettingsModal.value = false
    // 重置临时设置为当前设置
    tempCharacter.value = character.value
    tempNature.value = nature.value
    tempUseEnglish.value = useEnglish.value
}

// 检查设置是否有变化
const hasSettingsChanged = computed(() => {
    return tempCharacter.value !== character.value ||
        tempNature.value !== nature.value ||
        tempUseEnglish.value !== useEnglish.value
})

// 应用设置
const applySettings = () => {
    if (hasSettingsChanged.value) {
        showConfirmModal.value = true
    } else {
        closeSettingsModal()
    }
}

// 确认应用设置
const confirmApplySettings = async () => {
    try {
        // 应用新设置
        character.value = tempCharacter.value
        nature.value = tempNature.value
        useEnglish.value = tempUseEnglish.value

        // 重置会话
        const response = await restartConversation()
        if (response.data.code == 200) {
            messages.value = []
            showConfirmModal.value = false
            showSettingsModal.value = false
        } else {
            alert('重置会话失败，请重试')
        }
    } catch (error) {
        console.error('应用设置失败:', error)
        alert('应用设置失败，请重试')
    }
}

// 获取预览的角色名称
const getPreviewCharacterName = () => {
    const nameMap = {
        'teacher': '👨‍🏫 英语老师'
    }
    return nameMap[tempCharacter.value] || '👨‍🏫 英语老师'
}

// 获取预览的性格名称
const getPreviewNatureName = () => {
    const nameMap = {
        'gentle': '😊 彬彬有礼',
        'blunt': '🔥 脾气火爆',
        'tsundere': '😤 傲娇毒舌',
        'cold': '❄️ 高冷精英',
        'exaggerated': '🎭 夸张幽默'
    }
    return nameMap[tempNature.value] || '😊 彬彬有礼'
}

// 组件挂载时检查状态
onMounted(() => {
    // 初始化临时设置
    tempCharacter.value = character.value
    tempNature.value = nature.value
    tempUseEnglish.value = useEnglish.value

    // 延迟检查，确保用户已登录
    setTimeout(() => {
        checkAiChooseStatus()
        // 预加载练习单词
        loadPracticeWords()
    }, 1000)
})

// 发送消息
const sendMessage = async () => {
    if (!inputMessage.value.trim() || loading.value) return

    const userMessage = inputMessage.value.trim()

    // 添加用户消息
    messages.value.push({
        id: Date.now(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
    })

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
        const response = await fetch('api/aiApi/aiChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                character: character.value,
                nature: nature.value,
                model: model.value,
                useEnglish: useEnglish.value
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') {
                        // 流结束
                        const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
                        if (aiMessage) {
                            aiMessage.streaming = false
                        }
                        break
                    }

                    try {
                        const parsed = JSON.parse(data)
                        if (parsed.content) {
                            // 更新AI消息内容
                            const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
                            if (aiMessage) {
                                aiMessage.content += parsed.content
                                scrollToBottom()
                            }
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }

    } catch (error) {
        console.error('发送消息失败:', error)
        // 更新AI消息为错误提示
        const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
        if (aiMessage) {
            aiMessage.content = '抱歉，发生了错误，请稍后重试。'
            aiMessage.streaming = false
        }
    } finally {
        loading.value = false
        scrollToBottom()
    }
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

// 英文输入验证
const validateEnglishInput = (event) => {
    const value = event.target.value
    // 正则表达式：只允许英文字母、数字、标点符号、空格
    const englishOnlyRegex = /^[a-zA-Z0-9\s.,!?;:'"()\-_@#$%^&*+=<>{}[\]|\\\/~`]*$/

    if (!englishOnlyRegex.test(value)) {
        // 移除非英文字符
        const filteredValue = value.replace(/[^a-zA-Z0-9\s.,!?;:'"()\-_@#$%^&*+=<>{}[\]|\\\/~`]/g, '')
        inputMessage.value = filteredValue

        // 显示警告
        showInputWarning.value = true
        setTimeout(() => {
            showInputWarning.value = false
        }, 3000)
    }
}

// 侧边栏相关方法
const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
    if (showSidebar.value && practiceWords.value.length === 0) {
        loadPracticeWords()
    }
}

const toggleWordMeaning = (wordId) => {
    expandedWordId.value = expandedWordId.value === wordId ? null : wordId
}

const getStatusClass = (status) => {
    const statusMap = {
        'new': 'status-new',
        'learning': 'status-learning',
        'know': 'status-know',
        'unknown': 'status-unknown'
    }
    return statusMap[status] || 'status-default'
}

const getStatusText = (status) => {
    const statusMap = {
        'vague': '模糊',
        'know': '已知',
        'unknown': '不知道'
    }
    return statusMap[status] || status
}

const loadPracticeWords = async () => {
    try {
        const response = await getPracticeWords()
        if (response.data && response.data.code === 200) {
            practiceWords.value = response.data.data.words || []
        }
    } catch (error) {
        console.error('获取练习单词失败:', error)
    }
}

// 处理粘贴事件
const handlePaste = (event) => {
    event.preventDefault()
    const pastedText = event.clipboardData ? event.clipboardData.getData('text') : ''

    // 过滤非英文字符
    const englishOnlyRegex = /[a-zA-Z0-9\s.,!?;:'"()\-_@#$%^&*+=<>{}[\]|\\\/~`]/g
    const filteredText = pastedText.match(englishOnlyRegex)?.join('') || ''

    if (filteredText !== pastedText) {
        showInputWarning.value = true
        setTimeout(() => {
            showInputWarning.value = false
        }, 3000)
    }

    // 插入过滤后的文本
    const input = event.target
    const start = input.selectionStart
    const end = input.selectionEnd
    const currentValue = inputMessage.value

    inputMessage.value = currentValue.substring(0, start) + filteredText + currentValue.substring(end)

    // 设置光标位置
    nextTick(() => {
        input.setSelectionRange(start + filteredText.length, start + filteredText.length)
    })
}

// 格式化时间
const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<style scoped></style>
