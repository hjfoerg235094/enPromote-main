import { computed, onUnmounted, ref } from 'vue'

const MAX_RECORD_SECONDS = 30

export function usePcmRecorder(maxSeconds = MAX_RECORD_SECONDS) {
  const isRecording = ref(false)
  const recordingTime = ref(0)
  const errorMessage = ref('')

  let audioContext: AudioContext | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let processor: ScriptProcessorNode | null = null
  let mediaStream: MediaStream | null = null
  let recordingTimer: number | null = null
  let pcmData: Int16Array[] = []

  const canStop = computed(() => isRecording.value)

  const cleanupNodes = async () => {
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
    if (processor) {
      processor.disconnect()
      processor = null
    }
    if (source) {
      source.disconnect()
      source = null
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
    }
    if (audioContext) {
      await audioContext.close()
      audioContext = null
    }
  }

  const buildBlob = () => {
    const totalLength = pcmData.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Int16Array(totalLength)
    let offset = 0

    for (const chunk of pcmData) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    return new Blob([new Uint8Array(merged.buffer)], { type: 'audio/l16' })
  }

  const startRecording = async () => {
    if (isRecording.value) return

    try {
      await cleanupNodes()
      pcmData = []
      errorMessage.value = ''
      recordingTime.value = 0

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContext = new AudioContext({ sampleRate: 16000 })
      source = audioContext.createMediaStreamSource(mediaStream)
      processor = audioContext.createScriptProcessor(4096, 1, 1)

      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0)
        const int16Data = new Int16Array(channelData.length)

        for (let i = 0; i < channelData.length; i += 1) {
          const sample = Math.max(-1, Math.min(1, channelData[i]))
          int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        }

        pcmData.push(int16Data)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
      isRecording.value = true
      recordingTimer = window.setInterval(() => {
        recordingTime.value += 1
      }, 1000)
    } catch (error) {
      await cleanupNodes()
      isRecording.value = false
      errorMessage.value = '无法访问麦克风，请检查浏览器录音权限。'
      throw error
    }
  }

  const stopRecording = async () => {
    if (!isRecording.value) return null

    isRecording.value = false
    await cleanupNodes()

    if (recordingTime.value > maxSeconds) {
      errorMessage.value = `录音已超过 ${maxSeconds} 秒，请缩短后重试。`
      return null
    }

    if (!pcmData.length) {
      errorMessage.value = '没有捕获到录音内容，请重试。'
      return null
    }

    return buildBlob()
  }

  const resetRecorder = async () => {
    isRecording.value = false
    recordingTime.value = 0
    errorMessage.value = ''
    pcmData = []
    await cleanupNodes()
  }

  onUnmounted(() => {
    void resetRecorder()
  })

  return {
    canStop,
    errorMessage,
    isRecording,
    maxSeconds,
    recordingTime,
    resetRecorder,
    startRecording,
    stopRecording
  }
}
