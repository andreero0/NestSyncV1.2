import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Comprehensive End-to-End Testing
 * 
 * Tests navigation flows, state persistence, FAB functionality, design consistency,
 * forms, and user experience across all pages.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for state persistence tests

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 2,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/comprehensive-e2e-report' }],
    ['json', { outputFile: 'test-results/comprehensive-e2e-results.json' }],
    ['list'],
  ],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.NODE_ENV === 'production'
      ? 'https://nestsync.ca'
      : 'http://localhost:8082',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Screenshot settings for debugging */
    screenshot: 'only-on-failure',

    /* Video recording for debugging */
    video: 'retain-on-failure',

    /* Timeouts */
    actionTimeout: 15000, // Longer timeout for complex interactions
    navigationTimeout: 20000, // Longer timeout for page loads

    /* Context options */
    contextOptions: {
      locale: 'en-CA',
      timezoneId: 'America/Toronto',
    },
  },

  /* Configure projects for different viewports and browsers */
  projects: [
    {
      name: 'e2e-desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'e2e-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],

  /* Folder for test artifacts */
  outputDir: 'test-results/comprehensive-e2e',

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
  },

  /* Global test timeout */
  timeout: 90 * 1000, // 90 seconds max per test (longer for E2E flows)

  /* Expect timeout */
  expect: {
    timeout: 15 * 1000, // 15 seconds for assertions
  },

  /* Test match patterns - only comprehensive E2E tests */
  testMatch: [
    '**/tests/comprehensive-e2e.spec.ts',
  ],

  /* Ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.expo/**',
  ],
});
