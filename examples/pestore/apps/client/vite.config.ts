import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@pestore/api-lib',
        replacement: resolve(__dirname, '../api-lib/src/index.ts')
      },
      {
        find: '@eecho/definition',
        replacement: resolve(__dirname, '../../../../packages/libs/common/definition/src/index.ts')
      },
      {
        find: '@eecho/server', 
        replacement: resolve(__dirname, '../../../../packages/server/eecho/src/index.ts')
      },
      {
        find: '@eecho/api-client',
        replacement: resolve(__dirname, '../../../../packages/libs/client/api-client/src/index.ts')
      }
    ]
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})