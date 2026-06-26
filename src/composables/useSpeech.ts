import { onUnmounted, ref } from 'vue'

interface UseSpeechOptions {
  /** 识别语言，BCP-47 标签，默认中文 zh-CN */
  lang?: string
}

/**
 * 浏览器语音输入（Web Speech API）。
 * 纯前端、零依赖、零 API key：点开始 → 实时返回识别文字（含中间结果）→ 说完自动停。
 * Chrome / Edge 支持最好；本机 localhost 是安全上下文，麦克风权限可正常弹。
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const lang = options.lang ?? 'zh-CN'
  const isListening = ref(false)
  const transcript = ref('')
  const supported = ref(false)
  const error = ref('')

  const Ctor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : undefined
  supported.value = !!Ctor

  let recognition: SpeechRecognition | null = null

  function build(): SpeechRecognition {
    const rec = new (Ctor as SpeechRecognitionCtor)()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = true
    rec.onresult = (event) => {
      // 连续模式下要把所有片段拼起来（从 0 开始遍历，而不是 resultIndex）
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0]?.transcript ?? ''
      }
      transcript.value = text
    }
    rec.onerror = (event) => {
      error.value = friendlyError(event.error)
      isListening.value = false
    }
    rec.onend = () => {
      isListening.value = false
    }
    return rec
  }

  function start() {
    error.value = ''
    if (!Ctor) {
      error.value = '当前浏览器不支持语音，请用 Chrome 或 Edge'
      return
    }
    if (!recognition) recognition = build()
    transcript.value = ''
    try {
      recognition.start()
      isListening.value = true
    } catch {
      // 已在录音中再次 start 会抛错，忽略
    }
  }

  function stop() {
    try {
      recognition?.stop()
    } catch {
      /* 忽略 */
    }
    isListening.value = false
  }

  function toggle() {
    if (isListening.value) stop()
    else start()
  }

  onUnmounted(() => {
    try {
      recognition?.abort()
    } catch {
      /* 忽略 */
    }
  })

  return { isListening, transcript, supported, error, start, stop, toggle }
}

function friendlyError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风没权限，请在浏览器地址栏允许使用麦克风'
    case 'no-speech':
      return '没听到声音，大点声再说一次'
    case 'audio-capture':
      return '找不到麦克风设备'
    case 'network':
      return '语音识别网络异常（Chrome 识别需要联网）'
    default:
      return '语音识别出错了，再试一次'
  }
}
