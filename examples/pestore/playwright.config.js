const path = require('node:path');
const { defineConfig } = require('@playwright/test');

const currentDirectory = __dirname;
const serverDirectory = path.resolve(currentDirectory, 'apps/server');
const clientDirectory = path.resolve(currentDirectory, 'apps/client');

module.exports = defineConfig({
  testDir: path.resolve(currentDirectory, 'tests'),
  fullyParallel: false,
  workers: 1,
  timeout: 5 * 60 * 1000,
  expect: {
    timeout: 30_000,
  },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:43210',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npx tsx src/main.ts',
      cwd: serverDirectory,
      url: 'http://127.0.0.1:3100',
      timeout: 5 * 60 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 43210',
      cwd: clientDirectory,
      url: 'http://127.0.0.1:43210',
      timeout: 2 * 60 * 1000,
      reuseExistingServer: false,
    },
  ],
});
