import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Supabase — самая крупная зависимость. Отдельный чанк позволяет
        // браузеру кешировать её между релизами приложения.
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    restoreMocks: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
})
