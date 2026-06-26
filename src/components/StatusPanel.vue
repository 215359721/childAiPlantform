<script setup lang="ts">
// ③ 当前状态：运行成功 / 修改次数 / 最后修改时间。数据由 gameProgress 派生。
import { useGameProgress } from '@/composables/gameProgress'

const { modificationCount, lastModifiedAt } = useGameProgress()
</script>

<template>
  <aside class="status-panel" aria-label="当前状态">
    <h2 class="panel-title">📊 当前状态</h2>
    <ul class="status-list">
      <li class="status-item">
        <span class="status-emoji">✅</span>
        <div class="status-text">
          <span class="status-label">运行状态</span>
          <span class="status-value">运行成功</span>
        </div>
      </li>
      <li class="status-item">
        <span class="status-emoji">🔧</span>
        <div class="status-text">
          <span class="status-label">修改次数</span>
          <span class="status-value">{{ modificationCount }} 次</span>
        </div>
      </li>
      <li class="status-item">
        <span class="status-emoji">⏰</span>
        <div class="status-text">
          <span class="status-label">最后修改</span>
          <span class="status-value">{{ lastModifiedAt }}</span>
        </div>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.status-panel {
  background: var(--card-bg);
  border: 3px solid var(--card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--card-shadow);
  padding: 20px 22px;
}

.panel-title {
  font-family: var(--font-fun);
  margin: 0 0 14px;
  font-size: 1.2rem;
  color: var(--text-strong);
}

.status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-emoji {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: rgba(255, 209, 102, 0.35);
  border-radius: var(--radius-pill);
}

.status-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.status-label {
  font-size: 0.8rem;
  color: var(--text-soft);
}

.status-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-strong);
}
</style>
