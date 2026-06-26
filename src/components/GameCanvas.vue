<script setup lang="ts">
// ② 游戏区域卡片。内嵌 generated/GameContent.vue（Claude Code 会让这个内容不断"长大"）。
// 还没有任何作品时，显示欢迎占位；一旦有了作品（changeLog 里出现 feature），占位自动隐藏、作品占满画布。
import { computed } from 'vue'
import GameContent from '@/generated/GameContent.vue'
import { useGameProgress } from '@/composables/gameProgress'

const { modificationCount } = useGameProgress()
const hasWork = computed(() => modificationCount.value > 0)
</script>

<template>
  <section class="game-canvas" aria-label="游戏区域">
    <div class="work">
      <GameContent />
    </div>

    <transition name="fade">
      <div v-if="!hasWork" class="welcome">
        <div class="welcome-emojis">🍭🍬🌈</div>
        <h2 class="welcome-title">欢迎来到 AI Coding Playground！</h2>
        <p class="welcome-sub">
          把你想要的东西告诉旁边的大人，<br />
          看着它一点点长大吧 ✨
        </p>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.game-canvas {
  position: relative;
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg);
  border: 3px solid var(--card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--card-shadow);
  padding: 20px;
  overflow: hidden;
}

/* 作品区：绝对撑满整个画布，里面的作品按规则 100%×100% 填满，且不超出 */
.work {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
}

/* 空状态欢迎占位：盖在画布上，有作品后自动隐藏 */
.welcome {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  background: var(--card-bg);
}

.welcome-emojis {
  font-size: 3rem;
  animation: bob 2.8s ease-in-out infinite;
}

.welcome-title {
  font-family: var(--font-fun);
  font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  margin: 6px 0 0;
  color: var(--text-strong);
}

.welcome-sub {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text-soft);
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
