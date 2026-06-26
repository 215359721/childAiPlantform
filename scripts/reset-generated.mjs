// 一键重置：把 src/generated/ 还原成干净骨架，开新一轮 demo 用。
// 只动 GameContent.vue 和 changeLog.ts 两个文件；引擎、UI、换肤、语音等完全不碰。
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const today = new Date().toISOString().slice(0, 10)

const gameContent = `<script setup lang="ts">
// 游戏画布 —— Claude Code 在这里"种下"孩子要的东西（作品区）。
// 注意：空状态的"欢迎语"由 GameCanvas.vue 负责显示，不要写在这里。
// 每次新增需求时，"只增不改"地在 <template> 里继续加入新元素。
// 📐 规则：新加的场景/外层容器必须撑满整个画布（width:100%; height:100%），且内容不得溢出画布（超出用 overflow:hidden 裁剪）。
` + `<\/script>

<template>
  <!-- 孩子的作品会在这里一点点长大（由 Claude Code 添加） -->
</template>
`

const changeLog = `// 修改日志 —— 这是 Claude Code 每次新增需求时唯一需要"追加"的账本。
// 新增一条 = 一次"软件成长"。状态面板的"修改次数 / 最后修改时间"会自动从这里派生。
//
// 追加示例（在数组末尾加一条，保持已有内容不动）：
//   { emoji: '🦕', summary: '新增小恐龙', childSaid: '我要一个小恐龙', time: '${today}', type: 'feature' }
//
// type 取值：
//   - 'create'  项目创建（只此一条）
//   - 'feature' 孩子提出的新需求

export type ChangeType = 'create' | 'feature'

export interface ChangeEntry {
  /** 展示用的表情符号 */
  emoji: string
  /** AI 对这次修改的一句话总结 */
  summary: string
  /** 孩子当时的原话（可选） */
  childSaid?: string
  /** 发生时间（YYYY-MM-DD，或可读的相对描述） */
  time: string
  /** 类型：create = 项目创建；feature = 孩子提出的新需求 */
  type: ChangeType
}

export const changeLog: ChangeEntry[] = [
  {
    emoji: '🎉',
    summary: '项目创建',
    childSaid: '空项目，已经可以运行啦',
    time: '${today}',
    type: 'create',
  },
]
`

writeFileSync(join(root, 'src/generated/GameContent.vue'), gameContent)
writeFileSync(join(root, 'src/generated/changeLog.ts'), changeLog)

console.log('✨ 已重置为干净骨架：')
console.log('   - src/generated/GameContent.vue （清空，只剩占位注释）')
console.log('   - src/generated/changeLog.ts   （只剩"项目创建"一条）')
console.log('画布会显示欢迎语，可以开始新一轮了。')
