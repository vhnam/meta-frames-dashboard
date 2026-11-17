import { defineConfig, devices } from '@playwright/test';

const API_URL = 'http://127.0.0.1:18080';
const APP_URL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: !!process.env.CI,
  forbidOnly: !!process.env.CI,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-first-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Never reuse a running server: an occupied port must stop the run, not reach a developer stack.
  webServer: [
    {
      command: 'node e2e/stack.ts',
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // process env wins over .env, so the build always targets the test API
      command: 'vp build && vp preview --host 127.0.0.1 --port 4173 --strictPort',
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { VITE_API_URL: API_URL },
    },
  ],
});
