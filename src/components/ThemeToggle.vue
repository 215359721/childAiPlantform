<script setup lang="ts">
// 右上角换肤：两个头像 👧 粉色 / 👦 蓝色，点哪个用哪套。当前主题对应的头像高亮。
import { useTheme } from '@/composables/useTheme'

const { theme, setTheme } = useTheme()
</script>

<template>
  <div class="theme-toggle" role="group" aria-label="换肤">
    <button
      class="avatar girl"
      :class="{ active: theme === 'pink' }"
      title="粉色系（女孩）"
      @click="setTheme('pink')"
    >
      <span class="face">👧</span>
    </button>
    <button
      class="avatar boy"
      :class="{ active: theme === 'blue' }"
      title="蓝色系（男孩）"
      @click="setTheme('blue')"
    >
      <span class="face">👦</span>
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 12px;
  right: 14px;
  z-index: 50;
  display: flex;
  gap: 8px;
  padding: 6px;
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--card-shadow);
}

.avatar {
  width: 42px;
  height: 42px;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.5;
  transition: transform 0.15s, opacity 0.2s, border-color 0.2s, box-shadow 0.2s,
    background 0.2s;
}

.avatar:hover {
  transform: translateY(-2px);
  opacity: 0.85;
}

.avatar .face {
  font-size: 1.4rem;
  line-height: 1;
  display: inline-block;
  /* emoji 字形通常略偏上，轻微下移做视觉居中 */
  transform: translateY(1px);
}

/* 每个头像代表固定的那套配色（不随当前主题变） */
.avatar.girl {
  background: rgba(255, 143, 177, 0.16);
}

.avatar.boy {
  background: rgba(79, 155, 255, 0.16);
}

.avatar.girl.active {
  opacity: 1;
  transform: scale(1.06);
  background: rgba(255, 143, 177, 0.32);
  border-color: #ff8fb1;
  box-shadow: 0 0 0 3px rgba(255, 143, 177, 0.3);
}

.avatar.boy.active {
  opacity: 1;
  transform: scale(1.06);
  background: rgba(79, 155, 255, 0.32);
  border-color: #4f9bff;
  box-shadow: 0 0 0 3px rgba(79, 155, 255, 0.3);
}
</style>
