<template>
    <div class="spelling-container">
        <div class="spelling-content">
            <!-- 头部区域 -->
            <div class="spelling-header">
                <div class="header-top">
                    <h2 class="title">拼写练习</h2>
                    <button class="exit-btn" @click="handleExit" title="退出拼写">
                        ✕
                    </button>
                </div>

                <!-- 进度条 -->
                <div class="progress-section">
                    <div class="progress-info">
                        <span class="progress-text">进度: {{ currentIndex }} / {{ totalWords }}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                    </div>
                </div>

                <p class="instruction">{{ currentWord?.mean || '请拼写单词' }}</p>
            </div>

            <div class="word-display">
                <!-- 显示下划线和用户输入 -->
                <div class="letters-container">
                    <div v-for="(letter, index) in wordLetters" :key="index" class="letter-slot" :class="{
                        'active': index === currentPosition,
                        'filled': userInput[index] !== '',
                        'correct': isComplete && userInput[index] === letter,
                        'incorrect': isComplete && userInput[index] !== letter && userInput[index] !== ''
                    }">
                        <span class="user-letter">{{ userInput[index] || '' }}</span>
                        <div class="underline"></div>
                    </div>
                </div>
            </div>

            <!-- 结果显示 -->
            <div v-if="isComplete" class="result-section">
                <div class="result-message" :class="{ 'success': isCorrect, 'error': !isCorrect }">
                    <div class="result-icon">
                        {{ isCorrect ? '✅' : '❌' }}
                    </div>
                    <div class="result-text">
                        <h3>{{ isCorrect ? '拼写正确！' : '拼写错误' }}</h3>
                        <p v-if="!isCorrect">
                            正确答案：<strong>{{ currentWord?.word || '' }}</strong>
                        </p>
                        <p v-if="!isCorrect">
                            你的答案：<strong>{{ userInputString }}</strong>
                        </p>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-secondary" @click="resetSpelling">
                        重新拼写
                    </button>
                    <button class="btn btn-primary" @click="nextWord">
                        下一个单词
                    </button>
                </div>
            </div>

            <!-- 移动端虚拟键盘 -->
            <div v-if="!isComplete" class="virtual-keyboard">
                <div class="keyboard-row">
                    <button v-for="letter in 'QWERTYUIOP'" :key="letter" class="key-btn letter-key"
                        @click="inputLetter(letter.toLowerCase())"
                        @touchstart.prevent="inputLetter(letter.toLowerCase())">
                        {{ letter }}
                    </button>
                </div>
                <div class="keyboard-row">
                    <button v-for="letter in 'ASDFGHJKL'" :key="letter" class="key-btn letter-key"
                        @click="inputLetter(letter.toLowerCase())"
                        @touchstart.prevent="inputLetter(letter.toLowerCase())">
                        {{ letter }}
                    </button>
                </div>
                <div class="keyboard-row">
                    <button class="key-btn action-key" @click="deleteLetter" @touchstart.prevent="deleteLetter">
                        ⌫
                    </button>
                    <button v-for="letter in 'ZXCVBNM'" :key="letter" class="key-btn letter-key"
                        @click="inputLetter(letter.toLowerCase())"
                        @touchstart.prevent="inputLetter(letter.toLowerCase())">
                        {{ letter }}
                    </button>
                    <button class="key-btn action-key" @click="completeSpelling" @touchstart.prevent="completeSpelling">
                        ✓
                    </button>
                </div>
            </div>

            <!-- 提示信息 -->
            <div v-if="!isComplete" class="hint-section">
                <p class="hint-text">
                    <span class="desktop-hint">使用键盘输入字母，按 Backspace 删除，按 Enter 完成拼写</span>
                    <span class="mobile-hint">点击下方字母按钮进行拼写</span>
                </p>
                <div class="progress-info">
                    已输入：{{ filledCount }} / {{ wordLength }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    currentWord: {
        type: Object,
        required: true,
        default: () => ({ word: '', mean: '' })
    },
    currentIndex: {
        type: Number,
        default: 0
    },
    totalWords: {
        type: Number,
        default: 1
    }
});

const emit = defineEmits(['complete', 'next', 'exit']);

// 响应式数据
const userInput = ref([]);
const currentPosition = ref(0);
const isComplete = ref(false);

// 移动端支持
const isMobile = ref(false);

// 计算属性
const wordLetters = computed(() => {
    if (!props.currentWord || !props.currentWord.word) {
        return [];
    }
    return props.currentWord.word.toLowerCase().split('');
});

const wordLength = computed(() => {
    if (!props.currentWord || !props.currentWord.word) {
        return 0;
    }
    return props.currentWord.word.length;
});

const userInputString = computed(() => {
    return userInput.value.join('');
});

const filledCount = computed(() => {
    return userInput.value.filter(letter => letter !== '').length;
});

const isCorrect = computed(() => {
    if (!props.currentWord || !props.currentWord.word) {
        return false;
    }
    return userInputString.value.toLowerCase() === props.currentWord.word.toLowerCase();
});

const progressPercentage = computed(() => {
    if (props.totalWords === 0) return 0;
    return Math.round((props.currentIndex / props.totalWords) * 100);
});

// 方法
const initializeSpelling = () => {
    userInput.value = new Array(wordLength.value).fill('');
    currentPosition.value = 0;
    isComplete.value = false;
};

const inputLetter = (letter) => {
    if (isComplete.value) return;

    const lowerLetter = letter.toLowerCase();
    if (currentPosition.value < wordLength.value) {
        userInput.value[currentPosition.value] = lowerLetter;
        currentPosition.value++;

        // 如果填满了所有位置，自动完成
        if (currentPosition.value >= wordLength.value) {
            completeSpelling();
        }
    }
};

const deleteLetter = () => {
    if (isComplete.value) return;

    if (currentPosition.value > 0) {
        currentPosition.value--;
        userInput.value[currentPosition.value] = '';
    }
};

const completeSpelling = () => {
    isComplete.value = true;
    emit('complete', {
        userInput: userInputString.value,
        isCorrect: isCorrect.value,
        word: props.currentWord?.word || ''
    });
};

const resetSpelling = () => {
    initializeSpelling();
};

const nextWord = () => {
    emit('next');
};

const handleExit = () => {
    emit('exit');
};

// 移动端支持函数
const detectMobile = () => {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
};

// 移除了手机键盘相关函数，只使用虚拟键盘

// 键盘事件处理
const handleKeydown = (event) => {
    if (isComplete.value && event.key !== 'Enter') return;

    if (event.key === 'Backspace') {
        event.preventDefault();
        deleteLetter();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (isComplete.value) {
            nextWord();
        } else if (filledCount.value === wordLength.value) {
            completeSpelling();
        }
    } else if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        inputLetter(event.key);
    }
};

// 监听单词变化
watch(() => props.currentWord, () => {
    initializeSpelling();
}, { immediate: true, deep: true });

// 生命周期
onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
    detectMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', detectMobile);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', detectMobile);
});
</script>

<style scoped>
@import '@/assets/css/spelling.css';
</style>
