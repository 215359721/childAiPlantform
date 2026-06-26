import { ref } from 'vue'
import { useTTS } from './useTTS'

/**
 * AI 工作流的流式状态机。
 * 调用 sendWish() 把孩子的需求 POST 到 /api/wish，并以 SSE 方式实时更新 status。
 */

export interface AiStatus {
  emoji: string
  label: string
  detail?: string
}

const isWorking = ref(false)
const status = ref<AiStatus | null>(null)

const { cancel: cancelTTS } = useTTS()

/** 状态主标题（也用于语音播报），统一对小朋友的口吻 */
export const STATUS_LABELS = {
  start: '好嘞，我这就帮你做！',
  thinking: '嗯……让我想想怎么做~',
  editing: '我动手啦，正在给你变出来~',
  done: '小朋友，按你的要求做好啦，看看满意吗？',
  fail: '哎呀，这次没做好，再试一次好不好？',
  error: '出了点小问题，等一下再试哦',
} as const

export function useAiWorkflow() {
  return { isWorking, status, sendWish }
}

export async function sendWish(text: string): Promise<void> {
  const wish = text.trim()
  if (isWorking.value || !wish) return

  isWorking.value = true
  setStatus('🤖', 'AI 收到啦，开始想办法…')

  try {
    const resp = await fetch('/api/wish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: wish }),
    })

    if (!resp.ok || !resp.body) {
      setStatus('⚠️', '没连上 AI', await safeError(resp))
      return
    }

    await readStream(resp.body)
  } catch (err) {
    setStatus('⚠️', '出错了', err instanceof Error ? err.message : String(err))
  } finally {
    isWorking.value = false
  }
}

/** 读取 SSE 流，按空行分帧，解析每条 data: 事件 */
async function readStream(body: ReadableStream<Uint8Array>): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep = buffer.indexOf('\n\n')
    while (sep >= 0) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      sep = buffer.indexOf('\n\n')

      const dataLine = frame
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'))
      if (!dataLine) continue

      const payload = dataLine.slice(5).trim()
      if (!payload) continue
      try {
        handleEvent(JSON.parse(payload) as StreamEvent)
      } catch {
        /* 忽略无法解析的帧 */
      }
    }
  }
}

interface StreamEvent {
  kind?: string
  text?: string
  file?: string
  ok?: boolean
  message?: string
}

function handleEvent(evt: StreamEvent): void {
  switch (evt.kind) {
    case 'start':
      cancelTTS() // 新一轮开始，打断上一句播报
      setStatus('🤖', STATUS_LABELS.start)
      break
    case 'thinking':
      if (evt.text) setStatus('🤔', STATUS_LABELS.thinking, evt.text)
      break
    case 'editing':
      setStatus('✏️', STATUS_LABELS.editing, evt.file ? `改文件：${evt.file}` : '')
      break
    case 'result':
      setStatus(evt.ok ? '✅' : '⚠️', evt.ok ? STATUS_LABELS.done : STATUS_LABELS.fail, evt.text || '')
      break
    case 'error':
      setStatus('⚠️', STATUS_LABELS.error, evt.message || '')
      break
    case 'done':
      setStatus('🎉', STATUS_LABELS.done) // 完成那句话；和 result 同一句，不会重复播报
      break
    default:
      break
  }
}

function setStatus(emoji: string, label: string, detail = ''): void {
  status.value = { emoji, label, detail }
}

async function safeError(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as { error?: string }
    return data.error || `HTTP ${resp.status}`
  } catch {
    return `HTTP ${resp.status}`
  }
}
