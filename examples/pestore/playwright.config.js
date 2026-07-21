const path = require('node:path');
const { defineConfig } = require('@playwright/test');

const currentDirectory = __dirname;

module.exports = defineConfig({
  testDir: path.resolve(currentDirectory, 'tests'),
  globalSetup: path.resolve(currentDirectory, 'playwright.global-setup.js'),
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
});
