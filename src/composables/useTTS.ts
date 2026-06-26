import { ref } from 'vue'

/**
 * 浏览器语音播报（SpeechSynthesis，文字转语音）。
 * 纯前端、零依赖、零 API key。AI 完成后把它的一句话总结念给孩子听。
 */
const TTS_KEY = 'acp-tts'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

/** 是否开启语音播报（默认开），存 localStorage */
const enabled = ref(
  typeof localStorage !== 'undefined' ? localStorage.getItem(TTS_KEY) !== 'off' : true,
)

// 预热语音列表（部分浏览器是异步加载的）
if (supported && typeof window !== 'undefined') {
  window.speechSynthesis.getVoices()
}

function pickZhVoice(): SpeechSynthesisVoice | undefined {
  if (!supported || typeof window === 'undefined') return undefined
  return window.speechSynthesis.getVoices().find((v) => /^zh/i.test(v.lang))
}

export function useTTS() {
  function speak(text: string): void {
    if (!supported || !enabled.value || !text.trim()) return
    const synth = window.speechSynthesis
    synth.cancel() // 打断上一句，避免堆积
    const u = new SpeechSynthesisUtterance(text.trim())
    u.lang = 'zh-CN'
    u.rate = 1
    u.pitch = 1.15 // 略高，更亲切
    const zh = pickZhVoice()
    if (zh) u.voice = zh
    synth.speak(u)
  }

  function cancel(): void {
    if (supported && typeof window !== 'undefined') window.speechSynthesis.cancel()
  }

  function toggle(): void {
    enabled.value = !enabled.value
    if (!enabled.value) cancel()
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TTS_KEY, enabled.value ? 'on' : 'off')
    }
  }

  return { enabled, supported, speak, cancel, toggle }
}
