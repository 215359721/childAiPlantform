<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { STATUS_LABELS, useAiWorkflow } from '@/composables/useAiWorkflow'
import { useSpeech } from '@/composables/useSpeech'
import { useTTS } from '@/composables/useTTS'

const { isWorking, status, sendWish } = useAiWorkflow()
const draft = ref('')

const {
  isListening,
  transcript,
  supported,
  error: speechError,
  start: startMic,
  stop: stopMic,
  toggle: toggleMic,
} = useSpeech({ lang: 'zh-CN' })

const { enabled: ttsOn, toggle: toggleTts, speak: speakTTS } = useTTS()

// 识别过程中把实时文字同步进输入框
watch(transcript, (t) => {
  if (isListening.value) draft.value = t
})

// 状态主标题一变就播报：给孩子讲 AI 现在在干嘛
let lastSpokenLabel = ''
function speakLabel(label: string): void {
  if (!label || label === lastSpokenLabel) return
  lastSpokenLabel = label
  speakTTS(label)
}
watch(
  () => status.value?.label,
  (label) => speakLabel(label ?? ''),
)

async function submit() {
  const text = draft.value.trim()
  if (!text || isWorking.value || isListening.value) return
  draft.value = ''
  // 在点击/空格的手势内播报第一句，同时解锁浏览器语音（解决首次不发声）
  speakLabel(STATUS_LABELS.start)
  await sendWish(text)
}

/** 空格循环：录音中→停+发送；没录音但有文字→发送；空闲→开始录音 */
function fire(): void {
  if (isWorking.value) return
  if (isListening.value) {
    stopMic()
    submit()
    return
  }
  if (draft.value.trim()) {
    submit()
    return
  }
  startMic()
}

function onMicClick() {
  if (isWorking.value) return
  toggleMic()
}

// 空格：构成"说→发→说→发"循环；输入法组字中的空格不拦截
function onKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.code === 'Space' && !e.isComposing) {
    e.preventDefault()
    fire()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="input-bar">
    <form class="form" @submit.prevent="submit">
      <input
        v-model="draft"
        class="field"
        type="text"
        :disabled="isWorking || isListening"
        :placeholder="
          isListening
            ? '🎤 正在听…再按一下 空格 发送给 AI'
            : '按 空格 开始说话，或直接打字（例如：我要一个会飞的小恐龙）'
        "
        maxlength="500"
        autocomplete="off"
      />

      <button
        type="button"
        class="tts"
        :class="{ off: !ttsOn }"
        :title="ttsOn ? '关闭 AI 语音播报' : '开启 AI 语音播报'"
        @click="toggleTts"
      >
        {{ ttsOn ? '🔊' : '🔇' }}
      </button>

      <button
        v-if="supported"
        type="button"
        class="mic"
        :class="{ listening: isListening }"
        :disabled="isWorking"
        :title="isListening ? '停止录音' : '语音输入'"
        @click="onMicClick"
      >
        {{ isListening ? '⏹' : '🎤' }}
      </button>

      <button class="send" type="submit" :disabled="isWorking || isListening || !draft.trim()">
        <span v-if="!isWorking">✨ 帮我做</span>
        <span v-else>AI 努力中…</span>
      </button>
    </form>

    <transition name="pop">
      <div v-if="speechError" class="speech-error">⚠️ {{ speechError }}</div>
    </transition>

    <transition name="pop">
      <div v-if="status" class="status" :class="{ working: isWorking }">
        <span class="status-emoji" :class="{ spin: isWorking }">{{ status.emoji }}</span>
        <div class="status-text">
          <span class="status-label">{{ status.label }}</span>
          <span v-if="status.detail" class="status-detail">{{ status.detail }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.input-bar {
  margin-top: 4px;
  flex-shrink: 0;
}

.form {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.field {
  flex: 1;
  min-width: 0;
  padding: 14px 22px;
  font-size: 1.05rem;
  font-family: var(--font-body);
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid var(--card-border);
  border-radius: var(--radius-pill);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field::placeholder {
  color: var(--text-soft);
}

.field:focus {
  border-color: var(--candy-pink);
  box-shadow: 0 0 0 4px rgba(var(--accent-soft-rgb), 0.25);
}

.field:disabled {
  opacity: 0.7;
}

.tts {
  flex-shrink: 0;
  width: 48px;
  font-size: 1.2rem;
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid var(--card-border);
  border-radius: var(--radius-pill);
  transition: transform 0.15s, opacity 0.2s;
}

.tts:hover {
  transform: translateY(-2px);
}

.tts.off {
  opacity: 0.45;
}

.mic {
  flex-shrink: 0;
  width: 52px;
  font-size: 1.4rem;
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid var(--card-border);
  border-radius: var(--radius-pill);
  transition: transform 0.15s, background 0.2s, color 0.2s;
}

.mic:hover:not(:disabled) {
  transform: translateY(-2px);
}

.mic:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mic.listening {
  color: #fff;
  background: linear-gradient(135deg, var(--candy-pink), var(--candy-grape));
  border-color: var(--candy-pink);
  animation: mic-pulse 1s ease-in-out infinite;
}

@keyframes mic-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.5);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(var(--accent-rgb), 0);
  }
}

.send {
  flex-shrink: 0;
  padding: 0 26px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--candy-pink), var(--candy-peach));
  border: none;
  border-radius: var(--radius-pill);
  box-shadow: 0 10px 22px -10px rgba(var(--accent-rgb), 0.8);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
  white-space: nowrap;
}

.send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px -10px rgba(var(--accent-rgb), 0.9);
}

.send:active:not(:disabled) {
  transform: translateY(0);
}

.send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.speech-error {
  margin-top: 10px;
  padding: 8px 14px;
  font-size: 0.88rem;
  color: #b5375a;
  background: rgba(255, 200, 210, 0.75);
  border-radius: 16px;
}

.status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 18px;
}

.status.working {
  background: rgba(var(--accent-soft-rgb), 0.25);
}

.status-emoji {
  font-size: 1.5rem;
}

.status-text {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  min-width: 0;
}

.status-label {
  font-weight: 600;
  color: var(--text-strong);
}

.status-detail {
  font-size: 0.85rem;
  color: var(--text-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spin {
  animation: spin 1s ease-in-out infinite;
}

.pop-enter-active {
  transition: all 0.25s ease;
}

.pop-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes spin {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}
</style>
