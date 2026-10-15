import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', viewport: { width: 1440, height: 1024 }, channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'), trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100', reuseExistingServer: false, timeout: 90000, env: { VITE_API_URL: 'http://127.0.0.1:4010', VITE_GOOGLE_CLIENT_ID: '' } },
})
