import path from 'node:path'
import { crx } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import tailwindcss from '@tailwindcss/vite'
import manifest from './manifest.config.ts'
import { name, version } from './package.json'

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/popup.html'),
        fullpage: path.resolve(__dirname, 'src/fullpage/fullpage.html'),
      },
    },
  },
  plugins: [
    crx({ manifest }),
    // zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }), //will enable once setting up CD
    tailwindcss(),
  ],
  server: {
    hmr: {
      port: 5173,
    },
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
})
