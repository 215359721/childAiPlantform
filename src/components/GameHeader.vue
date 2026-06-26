<script setup lang="ts">
// ① 页面标题。后续一般无需修改。
</script>

<template>
  <header class="game-header">
    <div class="title-row">
      <span class="emoji">🎮</span>
      <h1 class="title">AI Coding Playground</h1>
      <span class="emoji">🌈</span>
    </div>
    <p class="tagline">说一句话，看着它一点点长大 ✨</p>
  </header>
</template>

<style scoped>
.game-header {
  text-align: center;
  padding: 8px 0 4px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.emoji {
  font-size: 2.4rem;
  animation: bob 2.6s ease-in-out infinite;
}

.title {
  font-family: var(--font-fun);
  font-size: clamp(1.8rem, 5vw, 3rem);
  margin: 0;
  color: var(--text-strong);
  letter-spacing: 1px;
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.6);
}

.tagline {
  margin: 6px 0 0;
  font-size: 1rem;
  color: var(--text-soft);
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-8px) rotate(4deg);
  }
}
</style>
