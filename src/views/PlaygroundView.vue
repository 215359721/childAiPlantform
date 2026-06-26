<script setup lang="ts">
// 唯一页面：标题 + 游戏区 + 状态面板 + 修改日志。
import GameHeader from '@/components/GameHeader.vue'
import GameCanvas from '@/components/GameCanvas.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import ChangeLog from '@/components/ChangeLog.vue'
</script>

<template>
  <div class="playground">
    <GameHeader />

    <main class="playground-main">
      <div class="canvas-wrap">
        <GameCanvas />
      </div>
      <div class="side">
        <StatusPanel />
        <ChangeLog />
      </div>
    </main>

    <footer class="playground-footer">
      <span>孩子负责创意 · AI 负责编程 · 程序员负责审核运行</span>
    </footer>
  </div>
</template>

<style scoped>
.playground {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 22px 40px;
}

.playground-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
  margin-top: 18px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.playground-footer {
  margin-top: 26px;
  text-align: center;
  color: var(--text-soft);
  font-size: 0.9rem;
}

@media (max-width: 860px) {
  .playground-main {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
