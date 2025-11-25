import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      srcDirectory: 'src',
    }),
    viteReact({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      // React 19 compatibility shims
      'use-sync-external-store/shim/with-selector.js': path.resolve(__dirname, 'src/shims/with-selector.ts'),
      'use-sync-external-store/shim/with-selector': path.resolve(__dirname, 'src/shims/with-selector.ts'),
      'use-sync-external-store/shim/index.js': path.resolve(__dirname, 'src/shims/use-sync-external-store.ts'),
      'use-sync-external-store/shim': path.resolve(__dirname, 'src/shims/use-sync-external-store.ts'),
    },
  },
})
