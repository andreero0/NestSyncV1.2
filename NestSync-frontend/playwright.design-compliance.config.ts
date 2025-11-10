import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Design System Compliance Testing
 * 
 * This configuration is optimized for validating design system compliance
 * including colors, typography, spacing, touch targets, and Canadian tax calculations.
 * 
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/design-compliance-report' }],
    ['json', { outputFile: 'test-results/design-compliance-results.json' }],
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
    actionTimeout: 10000,
    navigationTimeout: 15000,

    /* Context options */
    contextOptions: {
      locale: 'en-CA',
      timezoneId: 'America/Toronto',
    },
  },

  /* Configure projects for different viewports and browsers */
  projects: [
    {
      name: 'compliance-desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'compliance-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],

  /* Folder for test artifacts */
  outputDir: 'test-results/design-compliance',

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
  },

  /* Global test timeout */
  timeout: 60 * 1000, // 60 seconds max per test

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Test match patterns - only design compliance tests */
  testMatch: [
    '**/tests/design-system-compliance.spec.ts',
    '**/tests/**/*compliance*.spec.ts',
  ],

  /* Ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.expo/**',
    '**/tests/**/*emergency*.spec.ts',
    '**/tests/**/*e2e*.spec.ts',
    '**/tests/**/*visual*.spec.ts',
  ],
});
