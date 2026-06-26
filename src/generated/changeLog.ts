// 修改日志 —— 这是 Claude Code 每次新增需求时唯一需要"追加"的账本。
// 新增一条 = 一次"软件成长"。状态面板的"修改次数 / 最后修改时间"会自动从这里派生。
//
// 追加示例（在数组末尾加一条，保持已有内容不动）：
//   { emoji: '🦕', summary: '新增小恐龙', childSaid: '我要一个小恐龙', time: '2026-06-26', type: 'feature' }
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
    time: '2026-06-26',
    type: 'create',
  },
]
