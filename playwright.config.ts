import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000/api/health',
    env: {
      N8N_WEBHOOK_URL: 'http://127.0.0.1:4010',
      INTEGRATION_WEBHOOK_SECRET: 'ci-integration-webhook-secret-change-me',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
