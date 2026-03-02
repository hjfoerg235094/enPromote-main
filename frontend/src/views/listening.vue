<template>
    <div class="listening-container">
        <!-- 头部区域 -->
        <div class="listening-header">
            <div class="header-content">
                <h1 class="title">听力训练</h1>
                <div class="progress-info" v-if="totalWords > 0">
                    <span class="progress-text">进度: {{ currentIndex + 1 }} / {{ totalWords }}</span>
                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                    </div>
                </div>
                <div class="progress-info" v-else>
                    <span class="progress-text">暂无练习单词</span>
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="listening-content">
            <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>正在加载单词...</p>
            </div>

            <!-- 没有单词的提示 -->
            <div v-else-if="!loading && words.length === 0" class="no-words-state">
                <div class="no-words-content">
                    <div class="no-words-icon">📚</div>
                    <h2>还没有需要练习的单词哦</h2>
                    <p class="no-words-message">快去词汇练习练几个再来吧！</p>
                    <div class="no-words-actions">
                        <button class="btn btn-primary" @click="goToVocabulary">
                            🚀 去词汇练习
                        </button>
                        <button class="btn btn-secondary" @click="goBack">
                            🏠 返回首页
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="currentWord" class="listening-exercise">
                <!-- 音频播放区域 -->
                <div class="audio-section">
                    <div class="audio-controls">
                        <button class="play-btn" @click="playAudio" :disabled="!audioUrl || audioLoading"
                            :class="{ playing: isPlaying }">
                            <span v-if="audioLoading">⏳</span>
                            <span v-else-if="isPlaying">⏸️</span>
                            <span v-else>🔊</span>
                        </button>
                        <div class="audio-info">
                            <p class="instruction" v-if="audioUrl">点击播放按钮或按空格键听单词发音</p>
                            <p class="instruction no-audio" v-else>该单词暂无音频，请直接根据提示拼写</p>
                            <p class="hint" v-if="showHint">提示: {{ currentWord.mean }}</p>
                        </div>
                    </div>

                    <div class="audio-actions">
                        <button class="hint-btn" @click="toggleHint" :class="{ active: showHint }">
                            💡 {{ showHint ? '隐藏提示 (Tab)' : '显示提示 (Tab)' }}
                        </button>
                        <button class="replay-btn" @click="playAudio" :disabled="!audioUrl">
                            🔄 重播 (空格)
                        </button>
                    </div>
                </div>

                <!-- 听写输入区域 -->
                <div class="input-section">
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

                    <!-- 移动端虚拟键盘 -->
                    <div v-if="!isComplete && isMobile" class="virtual-keyboard">
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
                            <button class="key-btn action-key" @click="playAudio" @touchstart.prevent="playAudio"
                                :disabled="!audioUrl || audioLoading">
                                🔊
                            </button>
                        </div>
                    </div>

                    <div class="input-info">
                        <p class="input-hint desktop-hint">键盘操作：字母键输入 | 退格键删除 | 空格键播放 | Tab键显示提示</p>
                        <p class="input-hint mobile-hint">点击字母按钮输入，点击删除按钮删除，点击喇叭按钮播放</p>
                        <p class="input-progress">已输入: {{ filledCount }} / {{ wordLength }}</p>
                    </div>
                </div>

                <!-- 结果显示区域 -->
                <div v-if="isComplete" class="result-section">
                    <div class="result-message" :class="{ success: isCorrect, error: !isCorrect }">
                        <div class="result-icon">
                            {{ isCorrect ? '✅' : '❌' }}
                        </div>
                        <div class="result-text">
                            <h3>{{ isCorrect ? '听写正确！' : '听写错误' }}</h3>
                            <p v-if="!isCorrect">
                                正确答案：<strong>{{ currentWord.word }}</strong>
                            </p>
                            <p v-if="!isCorrect">
                                你的答案：<strong>{{ userInputString }}</strong>
                            </p>
                            <p class="word-meaning">
                                释义：{{ currentWord.mean }}
                            </p>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="btn btn-secondary" @click="resetListening">
                            🔄 重新听写
                        </button>
                        <button class="btn btn-primary" @click="nextWord">
                            {{ currentIndex >= totalWords - 1 ? '完成训练' : '下一个单词' }} →
                        </button>
                    </div>
                </div>
            </div>

            <!-- 训练完成 -->
            <div v-else class="completion-state">
                <div class="completion-content">
                    <div class="completion-icon">🎉</div>
                    <h2>听力训练完成！</h2>
                    <div class="completion-stats">
                        <div class="stat-item">
                            <span class="stat-number">{{ correctCount }}</span>
                            <span class="stat-label">正确</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{ totalWords - correctCount }}</span>
                            <span class="stat-label">错误</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{ Math.round((correctCount / totalWords) * 100) }}%</span>
                            <span class="stat-label">准确率</span>
                        </div>
                    </div>
                    <div class="completion-actions">
                        <button class="btn btn-secondary" @click="restartTraining">
                            🔄 重新开始
                        </button>
                        <button class="btn btn-primary" @click="goBack">
                            🏠 返回首页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { getReviewWords, getWordAudio, updateWordPriority } from '@/api/word';
import { useRouter } from 'vue-router';

const router = useRouter();

// 响应式数据
const words = ref([]);
const currentIndex = ref(0);
const loading = ref(true);
const audioUrl = ref('');
const audioLoading = ref(false);
const isPlaying = ref(false);
const showHint = ref(false);
const userInput = ref([]);
const currentPosition = ref(0);
const isComplete = ref(false);
const correctCount = ref(0);

// 移动端支持
const isMobile = ref(false);

// 计算属性
const currentWord = computed(() => {
    if (!words.value || words.value.length === 0 || currentIndex.value >= words.value.length) {
        return null;
    }
    return words.value[currentIndex.value];
});

const totalWords = computed(() => words.value.length);

const progressPercentage = computed(() => {
    if (totalWords.value === 0) return 0;
    return Math.round((currentIndex.value / totalWords.value) * 100);
});

const wordLetters = computed(() => {
    if (!currentWord.value?.word) return [];
    return currentWord.value.word.toLowerCase().split('');
});

const wordLength = computed(() => {
    return wordLetters.value.length;
});

const userInputString = computed(() => {
    return userInput.value.join('');
});

const filledCount = computed(() => {
    return userInput.value.filter(letter => letter !== '').length;
});

const isCorrect = computed(() => {
    if (!currentWord.value?.word) return false;
    return userInputString.value.toLowerCase() === currentWord.value.word.toLowerCase();
});

// 方法
const loadWords = async () => {
    try {
        loading.value = true;
        const response = await getReviewWords();
        if (response.data.code === 200) {
            const allWords = response.data.data.words;
            console.log(allWords);

            // 检查是否有单词
            if (!allWords || allWords.length === 0) {
                words.value = [];

                return; // 不加载音频，让界面显示提示信息
            }
            words.value = allWords
            currentIndex.value = 0;
            await loadCurrentWordAudio();
        }
    } catch (error) {
        console.error('加载单词失败:', error);
    } finally {
        loading.value = false;
    }
};

const loadCurrentWordAudio = async () => {
    if (!currentWord.value?.word) return;

    try {
        audioLoading.value = true;
        const response = await getWordAudio({ word: currentWord.value.word });
        if (response.data.code === 200) {
            audioUrl.value = response.data.data;
        } else if (response.data.code === 404) {
            // 音频不存在，清空audioUrl
            audioUrl.value = '';
            console.warn(`单词 "${currentWord.value.word}" 的音频不存在:`, response.data.message);
        } else {
            // 其他错误
            audioUrl.value = '';
            console.error('获取音频失败:', response.data.message);
        }
    } catch (error) {
        console.error('加载音频失败:', error);
        audioUrl.value = '';
    } finally {
        audioLoading.value = false;
    }
};

const playAudio = () => {
    if (!audioUrl.value) {
        // 如果没有音频，自动显示提示
        if (!showHint.value) {
            toggleHint();
        }
        return;
    }

    const audio = new Audio(audioUrl.value);
    isPlaying.value = true;

    audio.play().then(() => {
        audio.addEventListener('ended', () => {
            isPlaying.value = false;
        });
    }).catch(error => {
        console.error('音频播放失败:', error);
        isPlaying.value = false;
    });
};

const toggleHint = () => {
    showHint.value = !showHint.value;
};

const initializeListening = () => {
    userInput.value = new Array(wordLength.value).fill('');
    currentPosition.value = 0;
    isComplete.value = false;
    showHint.value = false;
};

const inputLetter = (letter) => {
    if (currentPosition.value < wordLength.value) {
        userInput.value[currentPosition.value] = letter.toLowerCase();
        currentPosition.value++;

        // 检查是否完成输入
        if (currentPosition.value >= wordLength.value) {
            completeListening();
        }
    }
};

const deleteLetter = () => {
    if (currentPosition.value > 0) {
        currentPosition.value--;
        userInput.value[currentPosition.value] = '';
    }
};

const completeListening = () => {
    isComplete.value = true;
    if (isCorrect.value) {
        correctCount.value++;
    }
};

const resetListening = () => {
    initializeListening();
};

const nextWord = async () => {
    if (currentIndex.value >= totalWords.value - 1) {
        // 训练完成
        currentIndex.value = totalWords.value;
    } else {
        currentIndex.value++;
        await loadCurrentWordAudio();
        initializeListening();
    }
};

const restartTraining = async () => {
    currentIndex.value = 0;
    correctCount.value = 0;
    await loadCurrentWordAudio();
    initializeListening();
};

const goBack = () => {
    router.push('/');
};

const goToVocabulary = () => {
    router.push('/vocabulary');
};

// 键盘事件处理
const handleKeydown = (event) => {
    if (event.key === 'Enter' && isComplete.value) {
        event.preventDefault();
        if (isCorrect.value) {
            // 拼写正确，跳转下一个单词
            updateWordPriority({
                word: currentWord.value.word,
                newStatus: null
            });
            nextWord();
        } else {
            // 拼写错误，重新开始
            resetListening();
        }
        return;
    }

    // 空格键播放音频
    if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        playAudio();
        return;
    }

    // Tab键切换提示显示
    if (event.key === 'Tab') {
        event.preventDefault();
        toggleHint();
        return;
    }

    if (isComplete.value) return;

    if (event.key === 'Backspace') {
        event.preventDefault();
        deleteLetter();
    } else if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        inputLetter(event.key);
    }
};

// 移动端检测
const detectMobile = () => {
    isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
};

// 生命周期
onMounted(() => {
    loadWords();
    document.addEventListener('keydown', handleKeydown);
    detectMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', detectMobile);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', detectMobile);
});

// 监听当前单词变化
watch(currentWord, () => {
    if (currentWord.value) {
        initializeListening();
    }
});
</script>

<style scoped src="@/assets/css/listening.css"></style>