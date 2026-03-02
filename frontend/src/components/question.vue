<template>
    <div v-if="showModal" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
            <div class="modal-header">
                <h2>🎯 设置你的学习计划</h2>
                <p class="subtitle">为了提供更好的学习体验，请告诉我们你的学习目标</p>
            </div>

            <div class="modal-content">
                <!-- 每日学习单词数 -->
                <div class="question-section">
                    <h3>📚 每日学习新单词数量</h3>
                    <p class="description">建议根据你的时间安排选择合适的数量</p>
                    <div class="options-grid">
                        <div v-for="option in studyOptions" :key="option.value"
                            :class="['option-card', { active: selectedStudyWords === option.value }]"
                            @click="selectedStudyWords = option.value">
                            <div class="option-number">{{ option.value }}</div>
                            <div class="option-label">{{ option.label }}</div>
                            <div class="option-time">{{ option.time }}</div>
                        </div>
                    </div>
                </div>

                <!-- 每日复习单词数 -->
                <div class="question-section">
                    <h3>🔄 每日复习单词数量</h3>
                    <p class="description">复习已学单词，巩固记忆效果</p>
                    <div class="options-grid">
                        <div v-for="option in reviewOptions" :key="option.value"
                            :class="['option-card', { active: selectedReviewWords === option.value }]"
                            @click="selectedReviewWords = option.value">
                            <div class="option-number">{{ option.value }}</div>
                            <div class="option-label">{{ option.label }}</div>
                            <div class="option-time">{{ option.time }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button @click="submitPlan" :disabled="loading || !selectedStudyWords || !selectedReviewWords"
                    class="submit-btn">
                    {{ loading ? '保存中...' : '开始我的学习之旅' }}
                </button>
                <p class="footer-note">💡 你可以随时在个人设置中修改这些选项</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { changeInfo } from '@/api/auth'

// Props
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['close', 'completed'])

// 响应式数据
const showModal = ref(props.show)
const selectedStudyWords = ref(null)
const selectedReviewWords = ref(null)
const loading = ref(false)

// 学习单词选项（10个递增）
const studyOptions = [
    { value: 10, label: '轻松入门', time: '约5-8分钟' },
    { value: 20, label: '稳步提升', time: '约10-15分钟' },
    { value: 30, label: '积极学习', time: '约15-20分钟' },
    { value: 40, label: '高效冲刺', time: '约20-25分钟' },
    { value: 50, label: '挑战极限', time: '约25-30分钟' }
]

// 复习单词选项（10个递增）
const reviewOptions = [
    { value: 10, label: '基础复习', time: '约3-5分钟' },
    { value: 20, label: '标准复习', time: '约6-8分钟' },
    { value: 30, label: '深度复习', time: '约9-12分钟' },
    { value: 40, label: '强化复习', time: '约12-15分钟' },
    { value: 50, label: '全面复习', time: '约15-18分钟' }
]

// 监听props变化
watch(() => props.show, (newVal) => {
    showModal.value = newVal
})

// 提交学习计划
const submitPlan = async () => {
    if (!selectedStudyWords.value || !selectedReviewWords.value) {
        return
    }

    loading.value = true

    try {
        const response = await changeInfo({
            planStudyWords: selectedStudyWords.value,
            planReviweWords: selectedReviewWords.value,
            question_completed: true
        })

        if (response.data.code === 200) {
            emit('completed', {
                planStudyWords: selectedStudyWords.value,
                planReviweWords: selectedReviewWords.value
            })
            closeModal()
        } else {
            console.error('保存失败:', response.data.message)
            alert('保存失败，请重试')
        }
    } catch (error) {
        console.error('提交学习计划失败:', error)
        alert('网络错误，请重试')
    } finally {
        loading.value = false
    }
}

// 关闭模态框
const closeModal = () => {
    showModal.value = false
    emit('close')
}

// 处理遮罩层点击（可选：允许点击遮罩关闭）
const handleOverlayClick = () => {
    // 暂时不允许点击遮罩关闭，确保用户完成设置
    // closeModal()
}

// 设置默认值
onMounted(() => {
    selectedStudyWords.value = 20 // 默认选择20个
    selectedReviewWords.value = 10 // 默认选择10个
})
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-container {
    background: white;
    border-radius: 16px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    padding: 30px 30px 20px;
    text-align: center;
    border-bottom: 1px solid #eee;
}

.modal-header h2 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 24px;
}

.subtitle {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.modal-content {
    padding: 30px;
}

.question-section {
    margin-bottom: 35px;
}

.question-section:last-child {
    margin-bottom: 0;
}

.question-section h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 18px;
}

.description {
    margin: 0 0 20px 0;
    color: #666;
    font-size: 14px;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 12px;
}

.option-card {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 16px 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.option-card:hover {
    border-color: #007bff;
    background: #f0f8ff;
    transform: translateY(-2px);
}

.option-card.active {
    border-color: #007bff;
    background: #007bff;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.option-number {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 4px;
}

.option-label {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 2px;
}

.option-time {
    font-size: 11px;
    opacity: 0.8;
}

.modal-footer {
    padding: 20px 30px 30px;
    text-align: center;
    border-top: 1px solid #eee;
}

.submit-btn {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border: none;
    border-radius: 25px;
    padding: 12px 30px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 15px;
}

.submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #0056b3, #004085);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.footer-note {
    margin: 0;
    color: #666;
    font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .modal-container {
        width: 95%;
        margin: 20px;
    }

    .modal-header,
    .modal-content,
    .modal-footer {
        padding-left: 20px;
        padding-right: 20px;
    }

    .options-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .option-card {
        padding: 12px 8px;
    }

    .option-number {
        font-size: 20px;
    }
}
</style>