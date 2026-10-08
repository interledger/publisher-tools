import { defineConfig, devices } from '@playwright/test'

const FRONTEND_PORT = 3000
// Matches APP_BASEPATH in frontend/app/lib/constants.ts
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}/tools/`

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm -C ../frontend dev',
    url: FRONTEND_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
