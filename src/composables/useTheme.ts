import { ref } from 'vue'

/** 主题：粉色系（女孩）/ 蓝色系（男孩） */
export type ThemeName = 'pink' | 'blue'

const THEME_KEY = 'acp-theme'

// 读取本地存储的选择（默认粉色）
const stored =
  typeof localStorage !== 'undefined' && localStorage.getItem(THEME_KEY) === 'blue' ? 'blue' : 'pink'

/** 当前主题（全局单例） */
export const theme = ref<ThemeName>(stored)

// 模块加载时立刻把 data-theme 写到 <html>，避免首屏闪烁
if (typeof document !== 'undefined') {
  document.documentElement.dataset.theme = theme.value
}

export function setTheme(next: ThemeName): void {
  theme.value = next
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = next
  if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, next)
}

export function toggleTheme(): void {
  setTheme(theme.value === 'pink' ? 'blue' : 'pink')
}

export function useTheme() {
  return { theme, setTheme, toggleTheme }
}
