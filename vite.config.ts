import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api', 'color-functions', 'global-builtin'],
        quietDeps: true
      }
    }
  },
  logLevel: 'error',
  build: {
    rollupOptions: {
      input: '/src/main.tsx'
    }
  }
})
