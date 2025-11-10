import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Accessibility Compliance testing
 * Focused on WCAG AA compliance validation
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
    ['html', { outputFolder: 'test-results/accessibility-report' }],
    ['json', { outputFile: 'test-results/accessibility-results.json' }],
    ['junit', { outputFile: 'test-results/accessibility-junit.xml' }]
  ],

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.NODE_ENV === 'production'
      ? 'https://nestsync.ca'
      : 'http://localhost:8082',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Screenshot settings for accessibility debugging */
    screenshot: 'only-on-failure',

    /* Video recording for failures */
    video: 'retain-on-failure',

    /* Timeout settings */
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  /* Configure projects for major browsers and devices */
  projects: [
    {
      name: 'accessibility-chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'accessibility-firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'accessibility-safari-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'accessibility-mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'accessibility-mobile-safari',
      use: {
        ...devices['iPhone 13'],
      },
    },

    {
      name: 'accessibility-tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  /* Folder for test artifacts */
  outputDir: 'test-results/accessibility',

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:8082',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global test timeout */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000,
  },

  /* Test match patterns - only run accessibility tests */
  testMatch: [
    '**/tests/accessibility-compliance.spec.ts',
  ],

  /* Ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.expo/**'
  ],
});
