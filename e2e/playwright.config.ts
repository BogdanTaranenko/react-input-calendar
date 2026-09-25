import { defineConfig, devices } from '@playwright/test';

const PORT = 5179;
// The example apps have their own config: playwright.compat.config.ts.
const desktop = { testIgnore: [/mobile\.spec/, /compat\//] };
const mobile = { testMatch: /(mobile|a11y)\.spec/ };

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    // Fixed so day names, captions and "today" read the same on every machine.
    locale: 'en-US',
    timezoneId: 'America/New_York',
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm exec vite --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, ...desktop },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, ...desktop },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, ...desktop },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] }, ...mobile },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] }, ...mobile },
  ],
});
