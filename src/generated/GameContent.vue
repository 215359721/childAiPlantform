<script setup lang="ts">
// 游戏画布 —— Claude Code 在这里"种下"孩子要的东西。
// 初始只有一句欢迎语。后续每次新增需求时，"只增不改"地在下方继续加入新元素。
//
// 新增示例（保持已有内容不动，在模板里继续加）：
//   <div class="dinosaur">🦕</div>
</script>

<template>
  <div class="welcome">
    <div class="welcome-emojis">🍭🍬🌈</div>
    <h2 class="welcome-title">欢迎来到 AI Coding Playground！</h2>
    <p class="welcome-sub">
      把你想要的东西告诉旁边的大人，<br />
      看着它一点点长大吧 ✨
    </p>
  </div>
</template>

<style scoped>
.welcome {
  min-height: 356px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
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
</style>
