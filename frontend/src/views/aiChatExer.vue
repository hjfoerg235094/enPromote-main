<template>
  <main class="voice-coach-page">
    <section class="voice-hero">
      <div>
        <span class="learn-kicker">AI 口语陪练</span>
        <h1>听一句，开口说一句，马上知道哪里要再练。</h1>
        <p>
          当前采用语音优先流程：先按目标句录音，完成口语评测，再让 AI 根据本轮表现推进下一句。
        </p>
      </div>

      <div class="session-card">
        <span>本轮进度</span>
        <strong>{{ completedTurns }}/{{ targetTurnCount }}</strong>
        <div class="learn-progress">
          <span :style="{ width: sessionProgress + '%' }"></span>
        </div>
        <button class="text-button" type="button" @click="resetSession">重新开始</button>
      </div>
    </section>

    <section class="voice-layout">
      <div class="coach-column">
        <div class="training-strip">
          <div>
            <span>训练模式</span>
            <strong>{{ modeLabel }}</strong>
          </div>
          <div>
            <span>评测等级</span>
            <strong>高中 / 句子</strong>
          </div>
          <div>
            <span>AI 风格</span>
            <strong>{{ natureLabel }}</strong>
          </div>
        </div>

        <div ref="turnListRef" class="turn-list">
          <article
            v-for="(turn, index) in turns"
            :key="turn.id"
            class="turn-card"
            :class="{ active: index === currentTurnIndex }"
          >
            <div class="turn-head">
              <span>Round {{ index + 1 }}</span>
              <strong>{{ turn.prompt }}</strong>
            </div>

            <div class="target-sentence">
              <span>跟读 / 回答目标句</span>
              <p>{{ turn.targetText }}</p>
            </div>

            <div v-if="turn.result" class="score-card">
              <div class="score-main">
                <div class="score-ring" :class="scoreClass(turn.result.overallScore)">
                  <strong>{{ Math.round(turn.result.overallScore) }}</strong>
                  <span>总分</span>
                </div>
                <div>
                  <h3>{{ turn.result.advice?.overall || '本轮已完成评测' }}</h3>
                  <p>{{ weakestAdvice(turn.result) }}</p>
                </div>
              </div>

              <div class="dimension-grid">
                <div v-for="item in dimensionsFor(turn.result)" :key="item.key" class="dimension-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ Math.round(item.value) }}</strong>
                  <div class="mini-bar">
                    <i :style="{ width: item.value + '%' }"></i>
                  </div>
                </div>
              </div>

              <div v-if="lowScoreWords(turn.result).length" class="weak-words">
                <span>建议复练</span>
                <button
                  v-for="word in lowScoreWords(turn.result)"
                  :key="word.text"
                  type="button"
                  :class="{ selected: expandedWord === word.text }"
                  @click="toggleWordDetail(word.text)"
                >
                  {{ word.text }} · {{ Math.round(word.score) }}
                </button>
              </div>

              <div v-if="expandedWord" class="phoneme-panel">
                <strong>{{ expandedWord }} 的音素细节</strong>
                <div class="phoneme-list">
                  <span
                    v-for="phoneme in phonemesForExpandedWord(turn.result)"
                    :key="`${phoneme.text}-${phoneme.score}`"
                    :class="scoreClass(phoneme.score)"
                  >
                    {{ phoneme.text }} {{ Math.round(phoneme.score) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="turn.coachReply" class="coach-reply">
              <span>AI 教练</span>
              <p>{{ turn.coachReply }}</p>
            </div>
          </article>
        </div>
      </div>

      <aside class="practice-panel" :class="{ open: showPracticePanel }">
        <div class="panel-section">
          <div class="section-title">
            <span>今日练习词</span>
            <button type="button" @click="showPracticePanel = false">收起</button>
          </div>
          <div v-if="practiceWords.length" class="practice-word-list">
            <button
              v-for="word in practiceWords"
              :key="word.id"
              type="button"
              class="practice-word"
              @click="useWordInTarget(word.word)"
            >
              <strong>{{ word.word }}</strong>
              <span>{{ word.chineseMeaning || '暂无释义' }}</span>
            </button>
          </div>
          <div v-else class="empty-panel">
            暂无练习词，本轮会使用默认场景句。
          </div>
        </div>

        <div class="panel-section">
          <div class="section-title">
            <span>训练设置</span>
          </div>
          <label class="setting-row">
            <span>AI 风格</span>
            <select v-model="nature">
              <option value="gentle">温和鼓励</option>
              <option value="blunt">直接纠错</option>
              <option value="cold">精简专业</option>
              <option value="exaggerated">活泼夸张</option>
            </select>
          </label>
          <label class="setting-row">
            <span>AI 回复语言</span>
            <select v-model="useEnglish">
              <option :value="false">中英混合</option>
              <option :value="true">全英文</option>
            </select>
          </label>
        </div>

        <div class="panel-section">
          <div class="section-title">
            <span>辅助文字</span>
          </div>
          <textarea
            v-model="customTargetText"
            rows="4"
            placeholder="输入一句你想练的英文，可设为本轮目标句。"
          ></textarea>
          <button
            class="learn-button secondary full"
            type="button"
            :disabled="!customTargetText.trim() || isBusy"
            @click="applyCustomTarget"
          >
            设为本轮目标
          </button>
        </div>
      </aside>
    </section>

    <section class="recording-dock">
      <button class="panel-toggle" type="button" @click="showPracticePanel = true">练习词</button>

      <div class="record-copy">
        <span>{{ recorderStatus }}</span>
        <strong>{{ currentTurn.targetText }}</strong>
        <p v-if="recorderError || evaluationError">{{ recorderError || evaluationError }}</p>
      </div>

      <div class="record-actions">
        <button
          class="record-button"
          type="button"
          :class="{ recording: isRecording }"
          :disabled="isEvaluating || loadingAi"
          @click="toggleRecording"
        >
          <span v-if="isRecording">停止 {{ recordingTime }}s</span>
          <span v-else>开始录音</span>
        </button>
        <button
          class="learn-button secondary"
          type="button"
          :disabled="!currentTurn.result || loadingAi"
          @click="retryCurrentTurn"
        >
          重录
        </button>
        <button
          class="learn-button"
          type="button"
          :disabled="!currentTurn.result || loadingAi"
          @click="confirmTurnAndContinue"
        >
          {{ loadingAi ? 'AI 生成反馈中...' : '继续下一轮' }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import '@/assets/css/aiChatExer.css'
import { getOralCoachFeedback, getPracticeWords, restartConversation, type PracticeWord } from '@/api/ai'
import { batchEvaluatePronunciation, type OralEvaluationResult } from '@/api/oral'
import { usePcmRecorder } from '@/composables/usePcmRecorder'
import { toast } from '@/utils/toastService'

type CoachNature = 'gentle' | 'blunt' | 'cold' | 'exaggerated'

interface PracticeTurn {
  id: number
  prompt: string
  targetText: string
  result?: OralEvaluationResult
  coachReply?: string
  nextAction?: 'retry' | 'next'
  nextPrompt?: string
  nextTargetText?: string
}

const route = useRoute()
const turnListRef = ref<HTMLElement | null>(null)
const practiceWords = ref<PracticeWord[]>([])
const turns = ref<PracticeTurn[]>([])
const currentTurnIndex = ref(0)
const customTargetText = ref('')
const expandedWord = ref('')
const evaluationError = ref('')
const isEvaluating = ref(false)
const loadingAi = ref(false)
const showPracticePanel = ref(false)
const nature = ref<CoachNature>('gentle')
const useEnglish = ref(false)
const targetTurnCount = 3

const {
  errorMessage: recorderError,
  isRecording,
  recordingTime,
  resetRecorder,
  startRecording,
  stopRecording
} = usePcmRecorder()

const mode = computed(() => String(route.query.mode || 'free'))
const currentTurn = computed(() => turns.value[currentTurnIndex.value] || createTurn(0))
const completedTurns = computed(() => turns.value.filter((turn) => Boolean(turn.result)).length)
const sessionProgress = computed(() => Math.min(100, Math.round((completedTurns.value / targetTurnCount) * 100)))
const isBusy = computed(() => isRecording.value || isEvaluating.value || loadingAi.value)

const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    free: '自由表达热身',
    task: '任务型对话',
    weakpoints: '薄弱点加练',
    speaking: '口语专项',
    grammar: '表达纠错',
    vocabulary: '词汇输出'
  }
  return labels[mode.value] || '自由表达热身'
})

const natureLabel = computed(() => {
  const labels: Record<CoachNature, string> = {
    gentle: '温和鼓励',
    blunt: '直接纠错',
    cold: '精简专业',
    exaggerated: '活泼夸张'
  }
  return labels[nature.value]
})

const recorderStatus = computed(() => {
  if (isEvaluating.value) return '正在评测这轮发音'
  if (loadingAi.value) return 'AI 正在准备下一轮'
  if (isRecording.value) return '正在录音，读完后点击停止'
  if (currentTurn.value.result) return '本轮已评测，可以确认继续'
  return '按目标句开口练习'
})

onMounted(async () => {
  await loadPracticeWords()
  turns.value = [createTurn(0)]
})

async function loadPracticeWords() {
  try {
    const response = await getPracticeWords()
    if (response.data?.code === 200) {
      practiceWords.value = response.data.data.words || []
    }
  } catch (error) {
    console.error('获取练习词失败:', error)
  }
}

function createTurn(index: number, coachReply = ''): PracticeTurn {
  const word = practiceWords.value[index % Math.max(practiceWords.value.length, 1)]?.word
  const templates = getModeTemplates(word)
  const template = templates[index % templates.length]

  return {
    id: Date.now() + index,
    prompt: template.prompt,
    targetText: template.targetText,
    coachReply
  }
}

function getModeTemplates(word?: string) {
  const focusWord = word || 'reservation'
  const templatesByMode: Record<string, Array<{ prompt: string; targetText: string }>> = {
    task: [
      {
        prompt: '向前台说明你的入住需求。',
        targetText: `Hello, I have a reservation, and I would like to check in now.`
      },
      {
        prompt: '礼貌询问餐厅推荐。',
        targetText: `Could you recommend a quiet table and one popular dish for dinner?`
      },
      {
        prompt: '确认下一步安排。',
        targetText: `That sounds good. I will come back in ten minutes and confirm the details.`
      }
    ],
    weakpoints: [
      {
        prompt: '慢一点，把重音读清楚。',
        targetText: `I need to pronounce ${focusWord} clearly and use it in a natural sentence.`
      },
      {
        prompt: '用完整句表达原因。',
        targetText: `I made a small mistake, but I can correct it and say the sentence again.`
      },
      {
        prompt: '复述并加入一个细节。',
        targetText: `The experience was useful because it helped me speak with more confidence.`
      }
    ],
    free: [
      {
        prompt: '用一句话开始今天的口语热身。',
        targetText: `Today I want to practice speaking English for a real travel situation.`
      },
      {
        prompt: '描述一个酒店或餐厅场景。',
        targetText: `I walked into the hotel lobby and asked the staff for some help.`
      },
      {
        prompt: '表达你的选择。',
        targetText: `I prefer this option because it is simple, clear, and comfortable for me.`
      }
    ]
  }

  return templatesByMode[mode.value] || templatesByMode.free
}

async function toggleRecording() {
  if (isRecording.value) {
    const audioBlob = await stopRecording()
    if (audioBlob) {
      await evaluateCurrentTurn(audioBlob)
    }
    return
  }

  await startRecording()
}

async function evaluateCurrentTurn(audio: Blob) {
  if (!currentTurn.value?.targetText) return

  try {
    isEvaluating.value = true
    evaluationError.value = ''
    expandedWord.value = ''

    const response = await batchEvaluatePronunciation({
      audio,
      texts: [currentTurn.value.targetText],
      category: 'sentence',
      level: 'senior'
    })

    if (!response.success || !response.data?.length) {
      evaluationError.value = response.message || '评测失败，请重试。'
      return
    }

    const result = response.data[0]
    turns.value[currentTurnIndex.value] = {
      ...currentTurn.value,
      result
    }
    await generateCoachFeedback(result)
  } catch (error) {
    console.error('口语评测失败:', error)
    evaluationError.value = '评测请求失败，请检查网络或稍后重试。'
  } finally {
    isEvaluating.value = false
    scrollToLatestTurn()
  }
}

async function confirmTurnAndContinue() {
  if (!currentTurn.value.result || loadingAi.value) return

  if (turns.value.length < targetTurnCount) {
    turns.value.push({
      id: Date.now() + turns.value.length,
      prompt: currentTurn.value.nextPrompt || '继续完成下一句场景表达。',
      targetText: currentTurn.value.nextTargetText || fallbackNextTargetText(),
      coachReply: ''
    })
    currentTurnIndex.value += 1
  }

  await resetRecorder()
  scrollToLatestTurn()
}

async function generateCoachFeedback(result: OralEvaluationResult) {
  try {
    loadingAi.value = true
    const response = await getOralCoachFeedback({
      targetText: currentTurn.value.targetText,
      evaluation: result,
      mode: mode.value,
      useEnglish: useEnglish.value,
      practiceWords: practiceWords.value.map((word) => word.word)
    })

    if (response.data?.code === 200 && response.data.data) {
      const feedback = response.data.data
      const nextTargetText = feedback.nextAction === 'retry'
        ? feedback.retryText || feedback.nextTargetText
        : feedback.nextTargetText

      turns.value[currentTurnIndex.value] = {
        ...currentTurn.value,
        coachReply: feedback.feedback,
        nextAction: feedback.nextAction,
        nextPrompt: feedback.nextPrompt,
        nextTargetText: nextTargetText || fallbackNextTargetText()
      }
      return
    }

    applyLocalCoachFallback(result)
  } catch (error) {
    console.error('生成口语教练反馈失败:', error)
    applyLocalCoachFallback(result)
  } finally {
    loadingAi.value = false
    scrollToLatestTurn()
  }
}

function applyLocalCoachFallback(result: OralEvaluationResult) {
  const weakWord = lowScoreWords(result)[0]?.text
  const shouldRetry = Boolean(weakWord) || Math.min(...dimensionsFor(result).map((item) => item.value)) < 75
  turns.value[currentTurnIndex.value] = {
    ...currentTurn.value,
    coachReply: shouldRetry
      ? `整体不错，但 "${weakWord || currentTurn.value.targetText}" 还需要更清楚。我们先把这一小段再练一遍。`
      : '这一句整体不错，我们继续推进到下一句场景表达。',
    nextAction: shouldRetry ? 'retry' : 'next',
    nextPrompt: shouldRetry ? '复练低分片段' : '继续完成场景表达',
    nextTargetText: shouldRetry ? weakWord || currentTurn.value.targetText : fallbackNextTargetText()
  }
}

function fallbackNextTargetText() {
  const nextIndex = Math.min(turns.value.length, targetTurnCount - 1)
  return createTurn(nextIndex).targetText
}

function retryCurrentTurn() {
  turns.value[currentTurnIndex.value] = {
    ...currentTurn.value,
    result: undefined,
    coachReply: undefined,
    nextAction: undefined,
    nextPrompt: undefined,
    nextTargetText: undefined
  }
  expandedWord.value = ''
  evaluationError.value = ''
  void resetRecorder()
}

async function resetSession() {
  try {
    await restartConversation()
  } catch (error) {
    console.error('重置 AI 会话失败:', error)
  }

  currentTurnIndex.value = 0
  turns.value = [createTurn(0)]
  expandedWord.value = ''
  evaluationError.value = ''
  customTargetText.value = ''
  await resetRecorder()
  toast.success('口语训练已重新开始')
}

function applyCustomTarget() {
  if (!customTargetText.value.trim()) return

  turns.value[currentTurnIndex.value] = {
    ...currentTurn.value,
    targetText: customTargetText.value.trim(),
    result: undefined,
    coachReply: undefined,
    nextAction: undefined,
    nextPrompt: undefined,
    nextTargetText: undefined
  }
  customTargetText.value = ''
  evaluationError.value = ''
}

function useWordInTarget(word: string) {
  const nextSentence = `I want to use the word ${word} in a clear and natural English sentence.`
  customTargetText.value = nextSentence
  applyCustomTarget()
  showPracticePanel.value = false
}

function dimensionsFor(result: OralEvaluationResult) {
  return [
    { key: 'accuracy', label: '准确度', value: result.dimensions.accuracy || 0 },
    { key: 'fluency', label: '流利度', value: result.dimensions.fluency || 0 },
    { key: 'integrity', label: '完整度', value: result.dimensions.integrity || 0 },
    { key: 'pronunciation', label: '发音', value: result.dimensions.pronunciation || 0 }
  ]
}

function lowScoreWords(result: OralEvaluationResult) {
  return (result.details?.words || [])
    .filter((word) => Number(word.score) < 82)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
}

function weakestAdvice(result: OralEvaluationResult) {
  const sorted = dimensionsFor(result).sort((a, b) => a.value - b.value)
  const weakest = sorted[0]
  const adviceMap: Record<string, string | undefined> = {
    accuracy: result.advice?.accuracy,
    fluency: result.advice?.fluency,
    integrity: result.advice?.integrity,
    pronunciation: result.advice?.pronunciation
  }

  return adviceMap[weakest.key] || `${weakest.label} 是本轮最值得复练的维度。`
}

function toggleWordDetail(wordText: string) {
  expandedWord.value = expandedWord.value === wordText ? '' : wordText
}

function phonemesForExpandedWord(result: OralEvaluationResult) {
  const word = result.details?.words?.find((item) => item.text === expandedWord.value)
  return word?.phonemes?.length ? word.phonemes : result.details?.phonemes || []
}

function scoreClass(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

function scrollToLatestTurn() {
  nextTick(() => {
    if (turnListRef.value) {
      turnListRef.value.scrollTop = turnListRef.value.scrollHeight
    }
  })
}
</script>
