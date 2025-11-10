import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Visual Regression Testing
 * 
 * This configuration is optimized for capturing screenshots and comparing
 * visual consistency across different screens and user states.
 * 
 * Requirements: 8.1, 8.2
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
    ['html', { outputFolder: 'test-results/visual-regression-report' }],
    ['json', { outputFile: 'test-results/visual-regression-results.json' }],
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

    /* Screenshot settings for visual regression */
    screenshot: 'on', // Always capture screenshots for visual tests

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
      name: 'visual-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 }, // iPhone 13 size
      },
    },

    {
      name: 'visual-tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },

    {
      name: 'visual-desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'visual-desktop-safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'visual-mobile-safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  /* Folder for test artifacts */
  outputDir: 'test-results/visual-regression',

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
    toHaveScreenshot: {
      maxDiffPixels: 100, // Allow small differences
      threshold: 0.2, // 20% threshold for pixel differences
    },
  },

  /* Test match patterns - only visual regression tests */
  testMatch: [
    '**/tests/visual-regression.spec.ts',
    '**/tests/**/*visual*.spec.ts',
  ],

  /* Ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.expo/**',
    '**/tests/**/*emergency*.spec.ts', // Exclude emergency tests
    '**/tests/**/*e2e*.spec.ts', // Exclude e2e tests
  ],
});
