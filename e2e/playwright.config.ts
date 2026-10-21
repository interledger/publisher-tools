import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import { API_URL, CDN_URL, FRONTEND_URL, S3_URL } from './src/services'

// Same env file as the dev servers, for the test wallet login (see docs/env-vars.md)
try {
  process.loadEnvFile(path.resolve(import.meta.dirname, '../.dev.vars'))
} catch {
  // CI sets the variables directly
}

const reuseExistingServer = !process.env.CI
const timeout = 120_000

/**
 * Playwright's Firefox can't start on macOS 27, which blocks access to the real
 * Firefox's app-data folder. Pointing its home folder somewhere else avoids that.
 * See https://github.com/microsoft/playwright/issues/42768
 */
function firefoxLaunchEnv(): Record<string, string> | undefined {
  if (process.platform !== 'darwin') return undefined
  const home = path.join(tmpdir(), 'publisher-tools-e2e-firefox-home')
  mkdirSync(home, { recursive: true })
  return { ...process.env, CFFIXED_USER_HOME: home } as Record<string, string>
}

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  // Tests share one local storage, so two saving at once would overwrite each other
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  // CI uploads the HTML report when the suite fails
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: { env: firefoxLaunchEnv() },
      },
    },
  ],
  webServer: [
    {
      name: 'S3',
      command: 'pnpm -C ../localenv/s3 dev',
      url: S3_URL,
      reuseExistingServer,
      timeout,
    },
    {
      name: 'API',
      // Apply D1 migrations first so a fresh checkout has the tables the api needs
      command: 'pnpm -C ../api migrate && pnpm -C ../api dev',
      url: API_URL,
      reuseExistingServer,
      timeout,
    },
    {
      name: 'CDN',
      command: 'pnpm -C ../cdn dev',
      // The cdn serves a 404 page until the first build finishes
      url: `${CDN_URL}/widget.js`,
      reuseExistingServer,
      timeout,
    },
    {
      name: 'Frontend',
      command: 'pnpm -C ../frontend dev',
      url: FRONTEND_URL,
      reuseExistingServer,
      timeout,
    },
  ],
})
