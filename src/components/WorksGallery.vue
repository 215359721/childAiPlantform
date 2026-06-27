<script setup lang="ts">
// 右上角「📁 我的作品库」：把当前画布另存为作品、随时切回之前的作品继续做。
// 一个作品 = src/generated/{GameContent.vue, changeLog.ts} 的快照，存在本地 works/ 目录。
import { ref, computed } from 'vue'
import { useWorks, type WorkMeta } from '@/composables/useWorks'
import { useGameProgress } from '@/composables/gameProgress'
import { useAiWorkflow } from '@/composables/useAiWorkflow'

const { works, loading, error, fetchWorks, saveWork, loadWork, deleteWork } = useWorks()
const { changes, modificationCount, lastModifiedAt } = useGameProgress()
const { isWorking } = useAiWorkflow()

const open = ref(false)
const name = ref('')
const emoji = ref('🎨')
const toast = ref<{ kind: 'ok' | 'err'; text: string } | null>(null)

const EMOJIS = ['🦕', '🦄', '🐰', '🐉', '🚀', '🌟', '🎨', '🎵', '🧩', '🍦', '⚽', '🏝️']

/** 最近一条日志（倒序，最新在前） */
const latest = computed(() => changes.value[0])
const canSave = computed(
  () =>
    !isWorking.value &&
    !loading.value &&
    modificationCount.value > 0 &&
    name.value.trim().length > 0,
)

function openModal() {
  open.value = true
  toast.value = null
  // 默认用最近一条日志的 summary / emoji 预填，省得孩子重新打字
  name.value = latest.value?.summary ?? ''
  emoji.value = latest.value?.emoji ?? '🎨'
  fetchWorks()
}

function closeModal() {
  if (loading.value) return
  open.value = false
}

async function onSubmitSave() {
  if (!canSave.value) return
  toast.value = null
  const meta = await saveWork({
    name: name.value.trim(),
    emoji: emoji.value,
    summary: latest.value?.summary ?? '',
    modificationCount: modificationCount.value,
    lastModifiedAt: lastModifiedAt.value,
    childSaid: latest.value?.childSaid,
  })
  if (meta) {
    toast.value = { kind: 'ok', text: `💾 已保存：${meta.name}` }
    name.value = ''
    emoji.value = latest.value?.emoji ?? '🎨'
  } else {
    toast.value = { kind: 'err', text: error.value || '保存失败，再试一次～' }
  }
}

async function onOpenWork(w: WorkMeta) {
  if (isWorking.value || loading.value) return
  if (!window.confirm(`切换到「${w.name}」？现在没保存的修改会丢掉哦～`)) return
  const ok = await loadWork(w.id)
  if (ok) {
    open.value = false
    // 文件已写回磁盘，等 Vite 重编译后刷新（对齐 ResetButton 的做法）
    setTimeout(() => location.reload(), 400)
  } else {
    toast.value = { kind: 'err', text: error.value || '打开失败，再试一次～' }
  }
}

async function onDeleteWork(w: WorkMeta) {
  if (isWorking.value || loading.value) return
  if (!window.confirm(`确定删除「${w.name}」吗？删了就找不回来啦～`)) return
  const ok = await deleteWork(w.id)
  if (ok) {
    toast.value = { kind: 'ok', text: `已删除：${w.name}` }
    await fetchWorks()
  } else {
    toast.value = { kind: 'err', text: error.value || '删除失败，再试一次～' }
  }
}

function shortDate(iso: string): string {
  return iso ? iso.slice(0, 10) : '—'
}
</script>

<template>
  <button class="works-fab" title="我的作品库" @click="openModal">📁</button>

  <div v-if="open" class="overlay" @click.self="closeModal">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-head">
        <h2>📁 我的作品库</h2>
        <button class="close" :disabled="loading" title="关闭" @click="closeModal">✕</button>
      </header>

      <!-- 当前作品 -->
      <section class="current">
        <div class="cur-emoji">{{ latest?.emoji ?? '🌱' }}</div>
        <div class="cur-info">
          <div class="cur-title">{{ latest?.summary ?? '还是空空的画布' }}</div>
          <div class="cur-meta">
            {{ modificationCount }} 次修改 · 最后 {{ lastModifiedAt }}
          </div>
        </div>
      </section>

      <!-- 另存为 -->
      <section class="save-form">
        <div class="save-label">💾 把现在的作品存下来：</div>
        <div class="save-row">
          <div class="emoji-pick">
            <button
              v-for="e in EMOJIS"
              :key="e"
              class="emoji-btn"
              :class="{ active: emoji === e }"
              type="button"
              @click="emoji = e"
            >
              {{ e }}
            </button>
          </div>
          <input
            v-model="name"
            class="name-input"
            type="text"
            placeholder="给作品起个名字"
            maxlength="30"
            @keyup.enter="onSubmitSave"
          />
          <button class="save-btn" :disabled="!canSave" @click="onSubmitSave">
            {{ loading ? '保存中…' : '另存为' }}
          </button>
        </div>
        <p v-if="modificationCount === 0" class="hint">
          画布还是空的，先让 AI 做点东西再存吧～
        </p>
        <p v-else-if="isWorking" class="hint">AI 正在工作，等它做完再来存哦～</p>
      </section>

      <!-- 提示 -->
      <transition name="fade">
        <div v-if="toast" class="toast" :class="toast.kind">{{ toast.text }}</div>
      </transition>

      <!-- 作品网格 -->
      <section class="grid-wrap">
        <div v-if="works.length === 0 && !loading" class="empty">
          还没有保存的作品哦～<br />做完一个，点上面「另存为」把它存下来吧！
        </div>
        <div v-else class="grid">
          <article v-for="w in works" :key="w.id" class="card">
            <div class="card-top">
              <span class="card-emoji">{{ w.emoji }}</span>
              <span class="card-count" title="修改次数">×{{ w.modificationCount }}</span>
            </div>
            <div class="card-name" :title="w.name">{{ w.name }}</div>
            <div class="card-summary" :title="w.summary">{{ w.summary || '—' }}</div>
            <div class="card-time">保存于 {{ shortDate(w.savedAt) }}</div>
            <div class="card-actions">
              <button
                class="act open"
                :disabled="isWorking || loading"
                @click="onOpenWork(w)"
              >
                打开
              </button>
              <button
                class="act del"
                :disabled="isWorking || loading"
                title="删除"
                @click="onDeleteWork(w)"
              >
                🗑
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 浮动按钮：复刻 ResetButton 的圆形糖果按钮，位置避开 ThemeToggle(14~118px) 与 ResetButton(126~166px) */
.works-fab {
  position: fixed;
  top: 16px;
  right: 170px;
  z-index: 50;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  margin: 0;
  font-size: 1.15rem;
  color: var(--text-strong);
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: 50%;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: transform 0.15s, opacity 0.2s;
}
.works-fab:hover {
  transform: translateY(-2px);
}

/* 遮罩 + 居中弹窗 */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(80, 60, 90, 0.42);
  backdrop-filter: blur(3px);
}
.modal {
  width: min(640px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  padding: 20px 22px 22px;
  border-radius: var(--radius-card);
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  box-shadow: 0 22px 50px rgba(120, 90, 140, 0.28);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.modal-head h2 {
  margin: 0;
  font-size: 22px;
  color: var(--text-strong);
}
.close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid var(--card-border);
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.15s, background 0.2s;
}
.close:hover:not(:disabled) {
  transform: rotate(90deg);
  background: #fff0f6;
}
.close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 当前作品条 */
.current {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 207, 226, 0.5), rgba(180, 216, 255, 0.45));
  border: 2px dashed var(--card-border);
}
.cur-emoji {
  font-size: 30px;
  line-height: 1;
}
.cur-info {
  flex: 1;
  min-width: 0;
}
.cur-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cur-meta {
  font-size: 12px;
  color: var(--text-soft, #8a6a9a);
  font-family: system-ui, sans-serif;
}

/* 另存为表单 */
.save-form {
  margin-top: 16px;
}
.save-label {
  font-size: 14px;
  color: var(--text-strong);
  margin-bottom: 8px;
}
.save-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.emoji-pick {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.emoji-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.15s, background 0.2s;
}
.emoji-btn:hover {
  transform: translateY(-1px);
}
.emoji-btn.active {
  border-color: #ff8fb1;
  background: rgba(255, 143, 177, 0.22);
  transform: scale(1.08);
}
.name-input {
  flex: 1;
  min-width: 140px;
  padding: 9px 12px;
  border-radius: 14px;
  border: 2px solid var(--card-border);
  background: #fff;
  font-size: 14px;
  color: var(--text-strong);
  outline: none;
  transition: border-color 0.15s;
}
.name-input:focus {
  border-color: #ff8fb1;
}
.save-btn {
  padding: 9px 18px;
  border-radius: 14px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #ff8fb1, #ff6f91);
  box-shadow: 0 4px 0 #d04868;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
}
.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #d04868;
}
.save-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #d04868;
}
.save-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: 0 4px 0 #d04868;
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-soft, #8a6a9a);
  font-family: system-ui, sans-serif;
}

/* 提示条 */
.toast {
  margin-top: 12px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-family: system-ui, sans-serif;
}
.toast.ok {
  background: rgba(180, 240, 180, 0.85);
  color: #2a7a2a;
}
.toast.err {
  background: rgba(255, 210, 210, 0.9);
  color: #a03030;
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 作品网格 */
.grid-wrap {
  margin-top: 16px;
}
.empty {
  padding: 26px 12px;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-soft, #8a6a9a);
  font-family: system-ui, sans-serif;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px dashed var(--card-border);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.card {
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 2px solid var(--card-border);
  box-shadow: 0 6px 14px rgba(150, 120, 170, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-emoji {
  font-size: 26px;
  line-height: 1;
}
.card-count {
  font-size: 12px;
  color: #fff;
  background: #ff8fb1;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: system-ui, sans-serif;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-summary {
  font-size: 12px;
  color: var(--text-soft, #8a6a9a);
  font-family: system-ui, sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-time {
  font-size: 11px;
  color: var(--text-soft, #a98ab4);
  font-family: system-ui, sans-serif;
}
.card-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.act {
  flex: 1;
  padding: 7px 0;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.12s, background 0.2s, opacity 0.2s;
}
.act.open {
  color: #fff;
  background: linear-gradient(135deg, #79b8ff, #5a9be8);
  box-shadow: 0 3px 0 #3f7fc4;
}
.act.open:hover:not(:disabled) {
  transform: translateY(-1px);
}
.act.del {
  flex: 0 0 auto;
  width: 40px;
  background: rgba(255, 255, 255, 0.8);
  border-color: #ffc0d0;
}
.act.del:hover:not(:disabled) {
  background: #ffe0e8;
}
.act:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
