import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { claudeBridgePlugin } from './server/claudeBridge'

// https://vitejs.dev/config/
// 说明：`@` 别名指向 src；claudeBridgePlugin 仅在 dev 下生效，
// 暴露 POST /api/wish，把孩子的需求送给 claude，并把过程实时推给网页。
export default defineConfig({
  plugins: [vue(), claudeBridgePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  server: {
    open: true,
  },
})
