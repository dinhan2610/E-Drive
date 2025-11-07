import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Hiển thị tất cả network interfaces
    open: true, // Tự động mở browser khi start
    strictPort: false, // Tự động tìm port khác nếu 5173 bị chiếm
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api', 'color-functions', 'global-builtin'],
        quietDeps: true
      }
    }
  },
  // Xóa logLevel: 'error' để hiển thị localhost URL
  build: {
    rollupOptions: {
      input: '/src/main.tsx'
    }
  }
})
