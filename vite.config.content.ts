import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'path'

// Chrome content scripts must be UTF-8, but some bundled source (Readability)
// contains multi-byte sequences that Chrome's content-script loader rejects.
// Escaping all non-ASCII chars to \uXXXX guarantees safe ASCII-only output.
function asciiOutputPlugin(): Plugin {
  return {
    name: 'ascii-output',
    generateBundle(_opts, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk') {
          chunk.code = chunk.code.replace(/[^\x00-\x7F]/gu, (char) => {
            const cp = char.codePointAt(0)!
            if (cp <= 0xFFFF) return `\\u${cp.toString(16).padStart(4, '0')}`
            // Surrogate pair for codepoints above U+FFFF
            const hi = Math.floor((cp - 0x10000) / 0x400) + 0xD800
            const lo = (cp - 0x10000) % 0x400 + 0xDC00
            return `\\u${hi.toString(16)}\\u${lo.toString(16)}`
          })
        }
      }
    },
  }
}

export default defineConfig({
  publicDir: false,
  plugins: [asciiOutputPlugin()],
  build: {
    outDir: resolve(__dirname, 'dist/content'),
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'ContentScript',
      formats: ['iife'],
      fileName: () => 'index.mjs',
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
