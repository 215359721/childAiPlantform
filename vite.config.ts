import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
// 说明：`@` 别名指向 src，方便后续 Claude Code 在 generated/ 中新增组件时引用。
// 用 fileURLToPath 解析，兼容 Windows 与中文路径，无需引入 node:path。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  server: {
    open: true,
  },
})
