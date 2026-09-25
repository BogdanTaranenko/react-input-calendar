import { defineConfig, devices } from '@playwright/test';

/** The example apps, built from the packed tarball by `pnpm compat`. */
export default defineConfig({
  testDir: 'tests/compat',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // Fixed so day names and dates read the same on every machine.
    locale: 'en-US',
    timezoneId: 'America/New_York',
    trace: 'on-first-retry',
  },
  // Always fresh servers: a leftover one would serve an older build of the tarball.
  webServer: [
    {
      command: 'npm --prefix ../examples/nextjs-app-router run start -- -p 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
    },
    {
      command: 'npm --prefix ../examples/vite-react18 run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
