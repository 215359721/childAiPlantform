<script setup lang="ts">
// ② 游戏区域卡片。内嵌 generated/GameContent.vue（Claude Code 会让这个内容不断"长大"）。
// - 还没有任何作品时，显示欢迎占位（有作品自动隐藏）。
// - AI 工作时，叠加一层不透明的趣味 loading，并按状态切换三套动画。
import { computed } from 'vue'
import GameContent from '@/generated/GameContent.vue'
import { useGameProgress } from '@/composables/gameProgress'
import { useAiWorkflow, STATUS_LABELS } from '@/composables/useAiWorkflow'

const { modificationCount } = useGameProgress()
const { isWorking, status } = useAiWorkflow()
const hasWork = computed(() => modificationCount.value > 0)

// 按状态主标题切换场景：思考→think，动手/建造→build，其它（收到）→magic
const scene = computed<'magic' | 'think' | 'build'>(() => {
  const label = status.value?.label ?? ''
  if (label === STATUS_LABELS.thinking) return 'think'
  if (label === STATUS_LABELS.editing) return 'build'
  return 'magic'
})

// 飘浮的糖果装饰（公共背景层）
const floaters = [
  { e: '🍭', left: '8%', delay: '0s', dur: '4s' },
  { e: '🍬', left: '24%', delay: '1.2s', dur: '5s' },
  { e: '⭐', left: '42%', delay: '0.6s', dur: '4.5s' },
  { e: '🧁', left: '60%', delay: '2s', dur: '5.5s' },
  { e: '💖', left: '76%', delay: '0.3s', dur: '4.2s' },
  { e: '✨', left: '90%', delay: '1.6s', dur: '4.8s' },
]
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

    <!-- AI 工作中的趣味 loading（不透明，完全遮住画布；按状态切换三套动画） -->
    <transition name="loading">
      <div v-if="isWorking" class="loading-overlay" aria-live="polite">
        <span
          v-for="(f, i) in floaters"
          :key="i"
          class="floater"
          :style="{ left: f.left, animationDelay: f.delay, animationDuration: f.dur }"
        >{{ f.e }}</span>

        <transition name="scene" mode="out-in">
          <!-- ① 魔法：收到愿望 -->
          <div v-if="scene === 'magic'" key="magic" class="scene scene-magic">
            <span class="rays"></span>
            <span class="halo"></span>
            <span class="wand">🪄</span>
            <span class="spark p1">✨</span>
            <span class="spark p2">⭐</span>
            <span class="spark p3">💫</span>
            <span class="spark p4">🌟</span>
            <span class="spark p5">✨</span>
          </div>
          <!-- ② 灵光：正在思考 -->
          <div v-else-if="scene === 'think'" key="think" class="scene scene-think">
            <div class="orbit o3"><span>💫</span></div>
            <div class="orbit o2"><span>⭐</span></div>
            <div class="orbit o1"><span>✨</span></div>
            <span class="bulb">💡</span>
          </div>
          <!-- ③ 建造：动手做 -->
          <div v-else key="build" class="scene scene-build">
            <span class="gear g1">⚙️</span>
            <span class="gear g2">⚙️</span>
            <div class="blocks"><span>🧱</span><span>🟦</span><span>🟧</span></div>
          </div>
        </transition>

        <p class="caption">{{ status?.label || 'AI 正在帮你变魔术' }}</p>
        <div class="dots"><span></span><span></span><span></span></div>
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

/* 作品区 */
.work {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
}

/* 空状态欢迎占位 */
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

/* ===== AI 工作中的 loading 遮罩（不透明，完全盖住画布）===== */
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  overflow: hidden;
  background: var(--bg-gradient);
}

.loading-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 42%,
    rgba(var(--accent-soft-rgb), 0.4),
    transparent 62%
  );
  pointer-events: none;
}

/* 公共：上升的糖果 */
.floater {
  position: absolute;
  bottom: -10%;
  font-size: 1.9rem;
  opacity: 0;
  z-index: 1;
  animation-name: rise;
  animation-timing-function: ease-in;
  animation-iteration-count: infinite;
  user-select: none;
}

@keyframes rise {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  15% {
    opacity: 0.95;
  }
  100% {
    transform: translateY(-120vh) rotate(45deg);
    opacity: 0;
  }
}

/* 场景公共 */
.scene {
  position: relative;
  z-index: 2;
  width: 190px;
  height: 190px;
  display: grid;
  place-items: center;
}

/* ===== 场景 ① 魔法 ===== */
.scene-magic .rays {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(var(--accent-rgb), 0.35) 20deg,
    transparent 45deg,
    rgba(var(--accent-rgb), 0.35) 90deg,
    transparent 115deg,
    rgba(var(--accent-rgb), 0.35) 180deg,
    transparent 205deg,
    rgba(var(--accent-rgb), 0.35) 270deg,
    transparent 300deg
  );
  animation: spin 6s linear infinite;
  filter: blur(2px);
}

.scene-magic .halo {
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(var(--accent-soft-rgb), 0.65) 0%,
    rgba(var(--accent-rgb), 0.3) 45%,
    rgba(255, 255, 255, 0) 72%
  );
  animation: pulse 1.6s ease-in-out infinite;
}

.scene-magic .wand {
  position: relative;
  z-index: 2;
  font-size: 4.2rem;
  transform-origin: 70% 80%;
  animation: wave 1.1s ease-in-out infinite;
}

.scene-magic .spark {
  position: absolute;
  z-index: 2;
  font-size: 1.5rem;
  animation: twinkle 1.3s ease-in-out infinite;
}
.scene-magic .p1 { top: 6px; left: 14px; }
.scene-magic .p2 { top: 0; right: 18px; animation-delay: 0.3s; }
.scene-magic .p3 { bottom: 18px; left: 0; animation-delay: 0.6s; font-size: 1.8rem; }
.scene-magic .p4 { bottom: 4px; right: 8px; animation-delay: 0.9s; }
.scene-magic .p5 { top: 40%; left: -6px; animation-delay: 0.45s; font-size: 1.2rem; }

@keyframes wave {
  0%,
  100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(20deg);
  }
}

/* ===== 场景 ② 灵光（思考）===== */
.scene-think .bulb {
  position: relative;
  z-index: 2;
  font-size: 4.2rem;
  animation: glow 1.4s ease-in-out infinite;
}

.scene-think .orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 2px dashed rgba(var(--accent-rgb), 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.scene-think .orbit.o1 {
  width: 96px;
  height: 96px;
  animation: spin 2.6s linear infinite;
}
.scene-think .orbit.o2 {
  width: 140px;
  height: 140px;
  animation: spin-rev 3.6s linear infinite;
}
.scene-think .orbit.o3 {
  width: 184px;
  height: 184px;
  animation: spin 5s linear infinite;
}
.scene-think .orbit > span {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.4rem;
}

@keyframes glow {
  0%,
  100% {
    filter: drop-shadow(0 0 6px rgba(255, 220, 120, 0.5));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 24px rgba(255, 220, 120, 1));
    transform: scale(1.1);
  }
}

/* ===== 场景 ③ 建造（动手）===== */
.scene-build .gear {
  position: absolute;
  font-size: 3.4rem;
}
.scene-build .g1 {
  top: 24px;
  left: 26px;
  animation: spin 4s linear infinite;
}
.scene-build .g2 {
  top: 46px;
  right: 26px;
  animation: spin-rev 4s linear infinite;
}
.scene-build .blocks {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}
.scene-build .blocks span {
  font-size: 1.7rem;
  animation: block-bounce 1.2s ease-in-out infinite;
}
.scene-build .blocks span:nth-child(2) {
  animation-delay: 0.2s;
}
.scene-build .blocks span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes block-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

/* 公共关键帧 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes spin-rev {
  to {
    transform: rotate(-360deg);
  }
}
.scene-think .orbit.o1,
.scene-think .orbit.o3 {
  /* spin 已定义；这里保留占位避免覆盖 */
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}

@keyframes twinkle {
  0%,
  100% {
    transform: scale(0.5) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.3) rotate(25deg);
    opacity: 1;
  }
}

/* 文案 + 跳动点 */
.caption {
  position: relative;
  z-index: 2;
  margin: 0;
  font-family: var(--font-fun);
  font-size: 1.5rem;
  color: var(--text-strong);
  text-align: center;
  padding: 0 12px;
}

.dots {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 8px;
}

.dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--candy-pink);
  animation: bounce-dot 1s ease-in-out infinite;
}

.dots span:nth-child(2) {
  animation-delay: 0.15s;
  background: var(--candy-lemon);
}

.dots span:nth-child(3) {
  animation-delay: 0.3s;
  background: var(--candy-mint);
}

@keyframes bounce-dot {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-11px);
    opacity: 1;
  }
}

/* 进出场过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-enter-active {
  transition: opacity 0.25s ease;
}
.loading-leave-active {
  transition: opacity 0.4s ease;
}
.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

.scene-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.scene-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.scene-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.scene-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
