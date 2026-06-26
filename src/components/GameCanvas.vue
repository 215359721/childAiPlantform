<script setup lang="ts">
// ② 游戏区域卡片。内嵌 generated/GameContent.vue（Claude Code 会让这个内容不断"长大"）。
import GameContent from '@/generated/GameContent.vue'
</script>

<template>
  <section class="game-canvas" aria-label="游戏区域">
    <GameContent />
  </section>
</template>

<style scoped>
.game-canvas {
  position: relative;
  min-height: 420px;
  background: var(--card-bg);
  border: 3px solid var(--card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--card-shadow);
  padding: 32px;
  overflow: hidden;
}
</style>
