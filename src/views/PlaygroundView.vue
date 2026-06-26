<script setup lang="ts">
// 唯一页面：标题 + 输入栏 + 游戏区 + 状态面板 + 修改日志。整页铺满视口，不出现页面滚动条。
import GameHeader from '@/components/GameHeader.vue'
import InputBar from '@/components/InputBar.vue'
import GameCanvas from '@/components/GameCanvas.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import ChangeLog from '@/components/ChangeLog.vue'
</script>

<template>
  <div class="playground">
    <GameHeader />
    <InputBar />

    <main class="playground-main">
      <GameCanvas />
      <div class="side">
        <StatusPanel />
        <ChangeLog />
      </div>
    </main>
  </div>
</template>

<style scoped>
.playground {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: clamp(14px, 1.6vw, 22px);
}

.playground-main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: minmax(0, 1fr);
  gap: 16px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

@media (max-width: 820px) {
  .playground-main {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    overflow-y: auto;
  }
}
</style>
