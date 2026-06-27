import { ref } from 'vue'

/**
 * 本地作品库前端封装。
 *
 * 一个作品 = src/generated/{GameContent.vue, changeLog.ts} 的快照，
 * 存在项目根的 works/ 目录（私有、不入 git）。
 * 保存/打开/删除都走 dev server 的 /api/works/* 接口（见 server/claudeBridge.ts）。
 *
 * works / loading / error 是模块级响应式状态，跨组件共享。
 */

/** 一件已保存作品的元信息（与 server 的 WorkMeta 对齐） */
export interface WorkMeta {
  id: string
  name: string
  emoji: string
  summary: string
  modificationCount: number
  lastModifiedAt: string
  childSaid?: string
  createdAt: string
  savedAt: string
}

/** 另存为新作品时前端要传给 server 的字段 */
export interface SaveWorkInput {
  name: string
  emoji: string
  summary: string
  modificationCount: number
  lastModifiedAt: string
  childSaid?: string
}

const works = ref<WorkMeta[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useWorks() {
  /** 拉取作品列表（按保存时间倒序） */
  async function fetchWorks(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const resp = await fetch('/api/works/list')
      const data = (await resp.json()) as WorkMeta[]
      works.value = Array.isArray(data) ? data : []
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  /** 另存当前画布为新作品，成功返回该作品的 meta */
  async function saveWork(input: SaveWorkInput): Promise<WorkMeta | null> {
    loading.value = true
    error.value = null
    try {
      const resp = await fetch('/api/works/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = (await resp.json()) as { ok?: boolean; work?: WorkMeta; error?: string }
      if (!data.ok || !data.work) {
        error.value = data.error || '保存失败'
        return null
      }
      return data.work
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      return null
    } finally {
      loading.value = false
    }
  }

  /** 打开（切换到）某作品：server 会把它的快照写回 src/generated/ */
  async function loadWork(id: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const resp = await fetch('/api/works/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = (await resp.json()) as { ok?: boolean; error?: string }
      if (!data.ok) {
        error.value = data.error || '打开失败'
        return false
      }
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      return false
    } finally {
      loading.value = false
    }
  }

  /** 删除某作品 */
  async function deleteWork(id: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const resp = await fetch('/api/works/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = (await resp.json()) as { ok?: boolean; error?: string }
      if (!data.ok) {
        error.value = data.error || '删除失败'
        return false
      }
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      return false
    } finally {
      loading.value = false
    }
  }

  return { works, loading, error, fetchWorks, saveWork, loadWork, deleteWork }
}
