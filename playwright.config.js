import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', locale: 'de-DE' },
  webServer: { command: 'node tools/serve.mjs', env: { PORT: '4173' }, port: 4173, reuseExistingServer: true },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] }, testIgnore: /offline/ },
    { name: 'offline', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } }, testMatch: /offline/ },
  ],
});
