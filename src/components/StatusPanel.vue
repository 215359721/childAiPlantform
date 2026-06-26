<script setup lang="ts">
// ③ 当前状态（紧凑两行，弱化视觉权重）：运行成功 / 修改次数 / 最后修改时间。数据由 gameProgress 派生。
import { useGameProgress } from '@/composables/gameProgress'

const { modificationCount, lastModifiedAt } = useGameProgress()
</script>

<template>
  <aside class="status-panel" aria-label="当前状态">
    <div class="row">
      <span class="metric ok"><span class="dot" />运行成功</span>
      <span class="metric"><i>🔧</i>{{ modificationCount }} 次修改</span>
    </div>
    <div class="row">
      <span class="metric"><i>⏰</i>最后修改：{{ lastModifiedAt }}</span>
    </div>
  </aside>
</template>

<style scoped>
.status-panel {
  flex-shrink: 0;
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: 18px;
  box-shadow: var(--card-shadow);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-soft);
}

.metric i {
  font-style: normal;
  font-size: 0.95rem;
}

.metric.ok {
  color: #2e9c6e;
  font-weight: 600;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ec78b;
  box-shadow: 0 0 0 3px rgba(78, 199, 139, 0.25);
}
</style>
