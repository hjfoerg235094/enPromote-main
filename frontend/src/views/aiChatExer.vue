<template>
  <main class="voice-coach-page">
    <section class="voice-hero">
      <div>
        <span class="learn-kicker">AI 口语陪练</span>
        <h1>听一句，开口说一句，马上知道哪里要再练。</h1>
        <p>
          <!-- 当前采用语音优先流程：先按目标句录音，完成口语评测，再让 AI 根据本轮表现推进下一句。 -->
        </p>
      </div>

      <div class="session-card">
        <span>本组目标词</span>
        <strong>{{ completedTurns }}/{{ targetWordCount }}</strong>
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
            <span>当前目标词</span>
            <strong>{{ currentTurn.targetWord }}</strong>
          </div>
          <div>
            <span>训练模式</span>
            <strong>{{ modeLabel }}</strong>
          </div>
          <div>
            <span>评测等级</span>
            <strong>高中 / 句子</strong>
          </div>
        </div>

        <div ref="turnListRef" class="turn-list">
          <article v-for="(turn, index) in turns" :key="turn.id" class="turn-card"
            :class="{ active: index === currentTurnIndex }">
            <div class="turn-head">
              <span>Word {{ index + 1 }} / {{ targetWordCount }}</span>
              <strong>{{ turn.prompt }}</strong>
              <em>{{ turn.targetWord }}</em>
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
                  <p class="turn-status" :class="{ retry: shouldRetryTurn(turn), passed: !shouldRetryTurn(turn) }">
                    {{ shouldRetryTurn(turn) ? '本词未达 80 分，先复练一次再进入下一个词。' : '本词已达标，可以继续练下一个目标词。' }}
                  </p>
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
                <button v-for="word in lowScoreWords(turn.result)" :key="word.text" type="button"
                  :class="{ selected: expandedWord === word.text }" @click="toggleWordDetail(word.text)">
                  {{ word.text }} · {{ Math.round(word.score) }}
                </button>
              </div>

              <div v-if="expandedWord" class="phoneme-panel">
                <strong>{{ expandedWord }} 的音素细节</strong>
                <div class="phoneme-list">
                  <span v-for="phoneme in phonemesForExpandedWord(turn.result)"
                    :key="`${phoneme.text}-${phoneme.score}`" :class="scoreClass(phoneme.score)">
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

          <article v-if="isSessionCompleted" class="summary-card">
            <div>
              <span class="learn-kicker">本组完成</span>
              <h2>5 个目标词都已经开口练过了。</h2>
              <p>{{ sessionSummaryText }}</p>
            </div>
            <div class="summary-metrics">
              <div>
                <span>平均分</span>
                <strong>{{ averageScore }}</strong>
              </div>
              <div>
                <span>最弱维度</span>
                <strong>{{ weakestDimensionLabel }}</strong>
              </div>
              <div>
                <span>建议复练</span>
                <strong>{{ reviewWordsText }}</strong>
              </div>
            </div>
            <div class="summary-actions">
              <button class="learn-button secondary" type="button" :disabled="!reviewTurns.length"
                @click="practiceReviewWords">
                复练建议词
              </button>
              <button class="learn-button" type="button" @click="resetSession">再练一组</button>
              <button class="learn-button secondary" type="button" @click="goDailyReport">
                去学习报告
              </button>
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
          <div v-if="sessionWords.length" class="practice-word-list">
            <button v-for="word in sessionWords" :key="word.id" type="button" class="practice-word"
              :class="wordStateClass(word.word)" @click="useWordInTarget(word.word)">
              <strong>{{ word.word }}</strong>
              <span>{{ word.chineseMeaning || '暂无释义' }}</span>
              <small>{{ wordStateLabel(word.word) }}</small>
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
          <textarea v-model="customTargetText" rows="4" placeholder="输入一句你想练的英文，可设为当前词的目标句。"></textarea>
          <button class="learn-button secondary full" type="button" :disabled="!customTargetText.trim() || isBusy"
            @click="applyCustomTarget">
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
        <button class="record-button" type="button" :class="{ recording: isRecording }"
          :disabled="isEvaluating || loadingAi" @click="toggleRecording">
          <span v-if="isRecording">停止 {{ recordingTime }}s</span>
          <span v-else>开始录音</span>
        </button>
        <button class="learn-button secondary" type="button" :disabled="!currentTurn.result || loadingAi"
          @click="retryCurrentTurn">
          重录
        </button>
        <button class="learn-button" type="button" :disabled="!currentTurn.result || loadingAi"
          @click="confirmTurnAndContinue">
          {{ continueButtonLabel }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/assets/css/aiChatExer.css'
import { getOralCoachFeedback, getPracticeWords, restartConversation, type PracticeWord } from '@/api/ai'
import { batchEvaluatePronunciation, type OralEvaluationResult } from '@/api/oral'
import { submitWordReview } from '@/api/word'
import { usePcmRecorder } from '@/composables/usePcmRecorder'
import { toast } from '@/utils/toastService'

type CoachNature = 'gentle' | 'blunt' | 'cold' | 'exaggerated'

interface PracticeTurn {
  id: number
  targetWord: string
  prompt: string
  targetText: string
  result?: OralEvaluationResult
  coachReply?: string
  nextAction?: 'retry' | 'next'
  nextPrompt?: string
  nextTargetText?: string
}

const route = useRoute()
const router = useRouter()
const turnListRef = ref<HTMLElement | null>(null)
const practiceWords = ref<PracticeWord[]>([])
const turns = ref<PracticeTurn[]>([])
const currentTurnIndex = ref(0)
const submittedReviewWords = ref<string[]>([])
const customTargetText = ref('')
const expandedWord = ref('')
const evaluationError = ref('')
const isEvaluating = ref(false)
const loadingAi = ref(false)
const showPracticePanel = ref(false)
const nature = ref<CoachNature>('gentle')
const useEnglish = ref(false)
const targetWordCount = 5
const fallbackWords: PracticeWord[] = [
  { id: 'fallback-reservation', word: 'reservation', chineseMeaning: '预订', phonetic: '/ˌrezərˈveɪʃn/', status: 'fallback', priority: 0, reviewCounts: 0 },
  { id: 'fallback-confirm', word: 'confirm', chineseMeaning: '确认', phonetic: '/kənˈfɜːrm/', status: 'fallback', priority: 0, reviewCounts: 0 },
  { id: 'fallback-recommend', word: 'recommend', chineseMeaning: '推荐', phonetic: '/ˌrekəˈmend/', status: 'fallback', priority: 0, reviewCounts: 0 },
  { id: 'fallback-option', word: 'option', chineseMeaning: '选择', phonetic: '/ˈɑːpʃn/', status: 'fallback', priority: 0, reviewCounts: 0 },
  { id: 'fallback-comfortable', word: 'comfortable', chineseMeaning: '舒适的', phonetic: '/ˈkʌmftəbl/', status: 'fallback', priority: 0, reviewCounts: 0 }
]

const {
  errorMessage: recorderError,
  isRecording,
  recordingTime,
  resetRecorder,
  startRecording,
  stopRecording
} = usePcmRecorder()

const mode = computed(() => String(route.query.mode || 'free'))
const storageKey = computed(() => `aiChatExer:session:${mode.value}`)
const sessionWords = computed(() => {
  const seen = new Set<string>()
  return [...practiceWords.value, ...fallbackWords]
    .filter((word) => {
      const normalized = word.word.trim().toLowerCase()
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
    .slice(0, targetWordCount)
})
const currentTurn = computed(() => turns.value[currentTurnIndex.value] || createTurn(0))
const completedWordSet = computed(() => new Set(
  turns.value
    .filter((turn) => turn.result && !shouldRetryTurn(turn))
    .map((turn) => turn.targetWord)
))
const completedTurns = computed(() => completedWordSet.value.size)
const sessionProgress = computed(() => Math.min(100, Math.round((completedTurns.value / targetWordCount) * 100)))
const isBusy = computed(() => isRecording.value || isEvaluating.value || loadingAi.value)
const isSessionCompleted = computed(() => completedTurns.value >= targetWordCount)

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

const recorderStatus = computed(() => {
  if (isEvaluating.value) return '正在评测这轮发音'
  if (loadingAi.value) return 'AI 正在准备下一轮'
  if (isRecording.value) return '正在录音，读完后点击停止'
  if (isSessionCompleted.value) return '本组目标词已完成，可以查看总结或再练一组'
  if (currentTurn.value.result) return '本词已评测，可以继续练下一个词'
  return '按目标句开口练习'
})

const continueButtonLabel = computed(() => {
  if (loadingAi.value) return 'AI 生成反馈中...'
  if (isSessionCompleted.value) return '查看总结'
  if (shouldRetryTurn(currentTurn.value)) return '按建议复练'
  return '练下一个词'
})

const averageScore = computed(() => {
  const results = turns.value.map((turn) => turn.result).filter(Boolean) as OralEvaluationResult[]
  if (!results.length) return 0
  return Math.round(results.reduce((sum, result) => sum + result.overallScore, 0) / results.length)
})

const weakestDimensionLabel = computed(() => {
  const totals: Record<string, { label: string; value: number; count: number }> = {}
  turns.value.forEach((turn) => {
    if (!turn.result) return
    dimensionsFor(turn.result).forEach((item) => {
      totals[item.key] = totals[item.key] || { label: item.label, value: 0, count: 0 }
      totals[item.key].value += item.value
      totals[item.key].count += 1
    })
  })
  const sorted = Object.values(totals)
    .map((item) => ({ ...item, average: item.count ? item.value / item.count : 0 }))
    .sort((a, b) => a.average - b.average)
  return sorted[0]?.label || '暂无'
})

const reviewWordsText = computed(() => {
  const weakWords = turns.value
    .filter((turn) => turn.result && Math.round(turn.result.overallScore) < 82)
    .map((turn) => turn.targetWord)
  return weakWords.length ? weakWords.slice(0, 3).join(' / ') : '保持节奏'
})

const lowScoreTurns = computed(() => turns.value.filter((turn) => shouldRetryTurn(turn)))
const reviewTurns = computed(() => turns.value.filter((turn) => turn.result && turn.result.overallScore < 82))

const sessionSummaryText = computed(() => {
  if (averageScore.value >= 88) return '整体表达很稳，可以把这些词放进更长的场景对话里继续练。'
  if (averageScore.value >= 75) return '已经完成核心输出，建议挑低分词再做一组短句复练。'
  return '先别急着加难度，优先复练低分词，把发音和完整度稳住。'
})

onMounted(async () => {
  await loadPracticeWords()
  restoreSession()
  if (!turns.value.length) {
    turns.value = [createTurn(0)]
  }
})

watch(
  [turns, currentTurnIndex, submittedReviewWords],
  () => {
    persistSession()
  },
  { deep: true }
)

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
  const word = sessionWords.value[index % targetWordCount]?.word || fallbackWords[index % fallbackWords.length].word
  const templates = getModeTemplates(word)
  const template = templates[index % templates.length]

  return {
    id: Date.now() + index,
    targetWord: word,
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
        prompt: `用 ${focusWord} 完成一次真实场景请求。`,
        targetText: sentenceForWord(focusWord, 'request')
      },
      {
        prompt: `把 ${focusWord} 放进礼貌提问里。`,
        targetText: sentenceForWord(focusWord, 'question')
      },
      {
        prompt: `用 ${focusWord} 确认下一步安排。`,
        targetText: sentenceForWord(focusWord, 'confirm')
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
        prompt: `用 ${focusWord} 开始今天的口语热身。`,
        targetText: sentenceForWord(focusWord, 'warmup')
      },
      {
        prompt: `把 ${focusWord} 放进酒店或餐厅场景。`,
        targetText: sentenceForWord(focusWord, 'scene')
      },
      {
        prompt: `用 ${focusWord} 表达你的选择。`,
        targetText: sentenceForWord(focusWord, 'choice')
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
    await recordSpokenWordReview(currentTurn.value.targetWord)
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

  if (isSessionCompleted.value) {
    toast.success('本组 5 个目标词已完成')
    scrollToLatestTurn()
    return
  }

  if (shouldRetryTurn(currentTurn.value)) {
    prepareRetryTurn()
    await resetRecorder()
    scrollToLatestTurn()
    return
  }

  if (turns.value.length < targetWordCount) {
    const nextIndex = turns.value.length
    const nextTurn = createTurn(nextIndex)
    turns.value.push({
      ...nextTurn,
      prompt: currentTurn.value.nextPrompt || nextTurn.prompt,
      targetText: buildNextTargetText(nextTurn),
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
  const nextIndex = Math.min(turns.value.length, targetWordCount - 1)
  return createTurn(nextIndex).targetText
}

function buildNextTargetText(nextTurn: PracticeTurn) {
  const aiTarget = currentTurn.value.nextTargetText?.trim()
  if (aiTarget && aiTarget.toLowerCase().includes(nextTurn.targetWord.toLowerCase())) {
    return aiTarget
  }
  return nextTurn.targetText
}

function shouldRetryTurn(turn: PracticeTurn) {
  return Boolean(turn.result && turn.result.overallScore < 80)
}

function sentenceForWord(word: string, type: string) {
  const lowerWord = word.toLowerCase()
  const sceneSentences: Record<string, Partial<Record<string, string>>> = {
    reservation: {
      request: 'I have a reservation under the name Li, and I would like to check in now.',
      question: 'Could you check my reservation and confirm the room type for tonight?',
      confirm: 'Thank you, I will keep this reservation and arrive before six o clock.',
      warmup: 'I have a reservation for tonight, and I would like to check in.',
      scene: 'At the hotel desk, I showed my reservation and asked for my room key.',
      choice: 'This reservation works well for me because the hotel is close to the station.'
    },
    confirm: {
      request: 'Could you confirm my booking details before I go to the room?',
      question: 'Can you confirm whether breakfast is included in my stay?',
      confirm: 'I want to confirm the checkout time before I leave tomorrow.',
      warmup: 'I need to confirm my plan before I meet the hotel staff.',
      scene: 'At the front desk, I asked the staff to confirm my room number.',
      choice: 'Please confirm this option, because it is the best choice for me.'
    },
    recommend: {
      request: 'Could you recommend a quiet table for dinner this evening?',
      question: 'What dish would you recommend for someone who likes mild food?',
      confirm: 'I will try the dish you recommend and order one drink as well.',
      warmup: 'I want to recommend a simple plan for our dinner tonight.',
      scene: 'In the restaurant, I asked the waiter to recommend a popular dish.',
      choice: 'I would recommend this option because it is simple and comfortable.'
    },
    option: {
      request: 'I prefer this option because it is simple and comfortable for me.',
      question: 'Which option is better if I need a quiet room?',
      confirm: 'This option works for me, so I would like to choose it.',
      warmup: 'I can explain this option clearly in one English sentence.',
      scene: 'The hotel gave me another option when my first room was not ready.',
      choice: 'I choose this option because it saves time and feels comfortable.'
    },
    comfortable: {
      request: 'I would like a comfortable room with a quiet space to rest.',
      question: 'Is there a more comfortable seat near the window?',
      confirm: 'This room is comfortable, and I am happy with the arrangement.',
      warmup: 'I want to sound comfortable and natural when I speak English.',
      scene: 'The room was comfortable, so I decided to stay there for one more night.',
      choice: 'I prefer this table because it is comfortable and not too noisy.'
    }
  }

  return sceneSentences[lowerWord]?.[type]
    || `I need to use ${word} clearly in this real travel situation.`
}

function retryWordSet() {
  return new Set(lowScoreTurns.value.map((turn) => turn.targetWord))
}

function wordStateClass(word: string) {
  return {
    selected: word === currentTurn.value.targetWord,
    completed: completedWordSet.value.has(word),
    retry: retryWordSet().has(word)
  }
}

function wordStateLabel(word: string) {
  if (word === currentTurn.value.targetWord) return '当前'
  if (completedWordSet.value.has(word)) return '已达标'
  if (retryWordSet().has(word)) return '待复练'
  return '未开始'
}

function practiceReviewWords() {
  if (!reviewTurns.value.length) return

  turns.value = reviewTurns.value.map((turn, index) => ({
    ...turn,
    id: Date.now() + index,
    result: undefined,
    coachReply: undefined,
    nextAction: undefined,
    nextPrompt: undefined,
    nextTargetText: undefined
  }))
  currentTurnIndex.value = 0
  expandedWord.value = ''
  evaluationError.value = ''
  toast.success('已切换到建议词复练')
  void resetRecorder()
  scrollToLatestTurn()
}

function goDailyReport() {
  void router.push('/daily-report')
}

function prepareRetryTurn() {
  const retryText = currentTurn.value.nextTargetText || currentTurn.value.targetText
  turns.value[currentTurnIndex.value] = {
    ...currentTurn.value,
    prompt: currentTurn.value.nextPrompt || '复练低分片段',
    targetText: retryText,
    result: undefined,
    coachReply: currentTurn.value.coachReply,
    nextAction: undefined,
    nextPrompt: undefined,
    nextTargetText: undefined
  }
  expandedWord.value = ''
  evaluationError.value = ''
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
  submittedReviewWords.value = []
  expandedWord.value = ''
  evaluationError.value = ''
  customTargetText.value = ''
  localStorage.removeItem(storageKey.value)
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
  const nextSentence = sentenceForWord(word, 'choice')
  turns.value[currentTurnIndex.value] = {
    ...currentTurn.value,
    targetWord: word
  }
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

async function recordSpokenWordReview(word: string) {
  const normalized = word.trim().toLowerCase()
  if (!normalized || submittedReviewWords.value.includes(normalized)) return

  try {
    await submitWordReview({
      word,
      newStatus: 'vague',
      isCorrect: true,
      source: 'ai-speaking'
    })
    submittedReviewWords.value = [...submittedReviewWords.value, normalized]
  } catch (error) {
    console.error('提交口语练习单词状态失败:', error)
  }
}

function persistSession() {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify({
      turns: turns.value,
      currentTurnIndex: currentTurnIndex.value,
      submittedReviewWords: submittedReviewWords.value,
      savedAt: Date.now()
    }))
  } catch (error) {
    console.error('保存口语训练进度失败:', error)
  }
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(storageKey.value)
    if (!raw) return

    const saved = JSON.parse(raw)
    if (!Array.isArray(saved.turns)) return

    turns.value = saved.turns
      .filter((turn: Partial<PracticeTurn>) => turn?.targetWord && turn?.targetText)
      .slice(0, targetWordCount)
      .map((turn: PracticeTurn, index: number) => ({
        ...turn,
        id: turn.id || Date.now() + index
      }))

    currentTurnIndex.value = Math.min(
      Number(saved.currentTurnIndex) || 0,
      Math.max(turns.value.length - 1, 0)
    )
    submittedReviewWords.value = Array.isArray(saved.submittedReviewWords)
      ? saved.submittedReviewWords
      : []
    if (turns.value.length) {
      toast.success('已恢复上次口语训练进度')
    }
  } catch (error) {
    console.error('恢复口语训练进度失败:', error)
  }
}
</script>
