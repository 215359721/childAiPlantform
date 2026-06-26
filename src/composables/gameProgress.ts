import { computed, ref } from 'vue'
import { changeLog, type ChangeEntry } from '@/generated/changeLog'

// 把日志数据装进响应式 ref。
// 数据本身来自 generated/changeLog.ts（每次 Claude Code 追加后，Vite 热更新会重新加载本模块）。
const entries = ref<ChangeEntry[]>([...changeLog])

export function useGameProgress() {
  /** 修改次数：只统计孩子提出的需求，不算项目创建 */
  const modificationCount = computed(
    () => entries.value.filter((entry) => entry.type !== 'create').length,
  )

  /** 最后一次修改时间：取账本里最后一条 */
  const lastModifiedAt = computed(
    () => entries.value[entries.value.length - 1]?.time ?? '—',
  )

  /** 展示用的倒序日志（最新在顶部） */
  const changes = computed(() => [...entries.value].reverse())

  return { changes, modificationCount, lastModifiedAt }
}
