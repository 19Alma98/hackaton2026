// Config separato per Vitest — evita conflitti di tipo tra vite@6 e vitest@2
// (vitest@2 bundla internamente vite@5, che non è type-compatible con vite@6)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
