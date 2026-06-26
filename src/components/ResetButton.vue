<script setup lang="ts">
// 右上角"重新开始"按钮：清空作品、回到欢迎语（带确认，防误触）。
import { ref } from 'vue'
import { useGameProgress } from '@/composables/gameProgress'

const { modificationCount } = useGameProgress()
const resetting = ref(false)

async function onReset() {
  if (modificationCount.value === 0 || resetting.value) return
  if (!window.confirm('确定要清空所有作品、重新开始吗？')) return
  resetting.value = true
  try {
    const resp = await fetch('/api/reset', { method: 'POST' })
    const data = (await resp.json()) as { ok?: boolean; error?: string }
    if (!data.ok) {
      window.alert('重置失败：' + (data.error || '未知错误'))
      resetting.value = false
      return
    }
    // 文件已改，Vite 会热更新；保险起见稍等一下再刷新
    setTimeout(() => location.reload(), 400)
  } catch (e) {
    window.alert('重置失败：' + (e instanceof Error ? e.message : String(e)))
    resetting.value = false
  }
}
</script>

<template>
  <button
    class="reset-btn"
    :disabled="modificationCount === 0 || resetting"
    :title="modificationCount === 0 ? '还没有作品可重置' : '清空所有作品，重新开始'"
    @click="onReset"
  >
    🔄
  </button>
</template>

<style scoped>
.reset-btn {
  position: fixed;
  top: 16px;
  right: 126px;
  z-index: 50;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-strong);
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: 50%;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: transform 0.15s, opacity 0.2s;
}

.reset-btn:hover:not(:disabled) {
  transform: translateY(-2px) rotate(-40deg);
}

.reset-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
