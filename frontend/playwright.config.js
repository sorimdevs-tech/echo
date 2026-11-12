import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:55324',
    actionTimeout: 15000,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `ECHOAI_FIXTURE_PORT=55323 ${process.env.ECHOAI_PYTHON || 'python3'} ../backend/browser_fixture.py`,
      url: 'http://127.0.0.1:55323/api/health',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'VITE_API_URL=/api VITE_API_TARGET=http://127.0.0.1:55323 npm run dev -- --host 127.0.0.1 --port 55324 --strictPort',
      url: 'http://127.0.0.1:55324',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
})
