<script setup lang="ts">
// ④ 修改日志：显示最近几次孩子说的话 + AI 的总结。数据由 gameProgress 派生。
import { useGameProgress } from '@/composables/gameProgress'

const { changes } = useGameProgress()
</script>

<template>
  <aside class="change-log" aria-label="修改日志">
    <h2 class="panel-title">📝 修改日志</h2>
    <ol class="log-list">
      <li v-for="(entry, index) in changes" :key="index" class="log-item">
        <span class="log-emoji">{{ entry.emoji }}</span>
        <div class="log-text">
          <span class="log-summary">{{ entry.summary }}</span>
          <span v-if="entry.childSaid" class="log-said">"{{ entry.childSaid }}"</span>
        </div>
        <span class="log-time">{{ entry.time }}</span>
      </li>
    </ol>
  </aside>
</template>

<style scoped>
.change-log {
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

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 18px;
}

.log-emoji {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.log-text {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  min-width: 0;
}

.log-summary {
  font-size: 0.98rem;
  color: var(--text-strong);
  font-weight: 600;
}

.log-said {
  font-size: 0.82rem;
  color: var(--text-soft);
}

.log-time {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--text-soft);
  white-space: nowrap;
}
</style>
