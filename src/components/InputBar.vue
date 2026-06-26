<script setup lang="ts">
import { ref } from 'vue'
import { useAiWorkflow } from '@/composables/useAiWorkflow'

const { isWorking, status, sendWish } = useAiWorkflow()

const draft = ref('')

async function submit() {
  const text = draft.value.trim()
  if (!text || isWorking.value) return
  draft.value = ''
  await sendWish(text)
}
</script>

<template>
  <div class="input-bar">
    <form class="form" @submit.prevent="submit">
      <input
        v-model="draft"
        class="field"
        type="text"
        :disabled="isWorking"
        placeholder="把你想要的告诉 AI，比如：我要一个会飞的小恐龙"
        maxlength="500"
        autocomplete="off"
      />
      <button class="send" type="submit" :disabled="isWorking || !draft.trim()">
        <span v-if="!isWorking">✨ 帮我做</span>
        <span v-else>AI 努力中…</span>
      </button>
    </form>

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
  margin-top: 16px;
}

.form {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.field {
  flex: 1;
  min-width: 0;
  padding: 16px 22px;
  font-size: 1.1rem;
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
  box-shadow: 0 0 0 4px rgba(255, 143, 177, 0.25);
}

.field:disabled {
  opacity: 0.7;
}

.send {
  flex-shrink: 0;
  padding: 0 28px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--candy-pink), var(--candy-peach));
  border: none;
  border-radius: var(--radius-pill);
  box-shadow: 0 10px 22px -10px rgba(214, 110, 150, 0.8);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
  white-space: nowrap;
}

.send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px -10px rgba(214, 110, 150, 0.9);
}

.send:active:not(:disabled) {
  transform: translateY(0);
}

.send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
}

.status.working {
  background: rgba(255, 209, 102, 0.35);
}

.status-emoji {
  font-size: 1.6rem;
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
  font-size: 0.88rem;
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
