import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  server: {
    host: true,
    port: 3000,
  },
  vite: {
    optimizeDeps: {
      noDiscovery: true,
      include: ['qs'],
    },
    resolve: {
      alias: [
        {
          find: '@pestore/api-lib',
          replacement: path.resolve(currentDirectory, '../api-lib/src/index.ts'),
        },
        {
          find: '@eecho/definition',
          replacement: path.resolve(currentDirectory, '../../../../packages/libs/common/definition/src/index.ts'),
        },
        {
          find: '@eecho/api-client',
          replacement: path.resolve(currentDirectory, '../../../../packages/libs/client/api-client/src/index.ts'),
        },
      ],
    },
  },
});
