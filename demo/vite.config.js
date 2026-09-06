import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const mock = fileURLToPath(new URL('./mockDb.js', import.meta.url))

/**
 * Сборка демонстрации: то же приложение, но слой данных подменён на
 * работающий в памяти. Экраны, состояния и обработка ошибок не менялись.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    {
      name: 'kap-demo-db',
      enforce: 'pre',
      resolveId(source) {
        if (/(^|\/)lib\/(db|supabase)(\.js)?$/.test(source)) return mock
        return null
      },
    },
  ],
  build: {
    outDir: fileURLToPath(new URL('../demo-dist', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
