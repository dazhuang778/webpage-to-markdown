import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist/background'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/background/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
